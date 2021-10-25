package systems.rcd.enonic.datatoolbox;

import java.util.List;
import java.util.Map;
import java.util.function.Supplier;
import java.util.stream.Collectors;

import systems.rcd.fwk.core.format.json.RcdJsonService;
import systems.rcd.fwk.core.format.json.data.RcdJsonObject;

import com.enonic.xp.branch.Branch;
import com.enonic.xp.node.ApplyNodePermissionsParams;
import com.enonic.xp.node.ApplyNodePermissionsResult;
import com.enonic.xp.node.NodeId;
import com.enonic.xp.node.NodeService;
import com.enonic.xp.repository.RepositoryId;
import com.enonic.xp.script.bean.BeanContext;
import com.enonic.xp.security.PrincipalKey;
import com.enonic.xp.security.acl.AccessControlEntry;
import com.enonic.xp.security.acl.AccessControlList;
import com.enonic.xp.security.acl.Permission;

public class RcdPermissionScriptBean
    extends RcdScriptBean
{
    private Supplier<NodeService> nodeServiceSupplier;

    @Override
    public void initialize( final BeanContext context )
    {
        nodeServiceSupplier = context.getService( NodeService.class );
    }

    public String apply( final String repositoryName, final String branchName, final String nodeId, boolean inheritPermissions,
                         boolean overwriteChildPermissions, List<Map<String, Object>> permissions )
    {
        return runSafely( () -> {

            final ApplyNodePermissionsParams params = ApplyNodePermissionsParams.create().
                nodeId( NodeId.from( nodeId ) ).
                inheritPermissions( inheritPermissions ).
                overwriteChildPermissions( overwriteChildPermissions ).
                permissions( toAccessControlList( permissions ) ).
                build();
            final ApplyNodePermissionsResult applicationResult =
                createContext( RepositoryId.from( repositoryName ), Branch.from( branchName ) ).
                    callWith( () -> nodeServiceSupplier.get().applyPermissions( params ) );

            final RcdJsonObject result = RcdJsonService.createJsonObject().
                put( "succeedNodes", applicationResult.getSucceedNodes().getSize() ).
                put( "skippedNodes", applicationResult.getSkippedNodes().getSize() );

            return createSuccessResult( result );
        }, "Error while applying permissions" );
    }

    private AccessControlList toAccessControlList( final List<Map<String, Object>> permissions )
    {
        final AccessControlList.Builder acl = AccessControlList.create();
        permissions.forEach( permission -> acl.add( AccessControlEntry.create().
            principal( PrincipalKey.from( (String) permission.get( "principal" ) ) ).
            allow( toPermissions( (Map<String, String>) permission.get( "allow" ) ) ).
            deny( toPermissions( (Map<String, String>) permission.get( "deny" ) ) ).
            build() ) );
        return acl.build();
    }

    private List<Permission> toPermissions( final Map<String, String> permissionList )
    {
        return permissionList.values().stream().
            map( Permission::valueOf ).
            collect( Collectors.toList() );
    }
}
