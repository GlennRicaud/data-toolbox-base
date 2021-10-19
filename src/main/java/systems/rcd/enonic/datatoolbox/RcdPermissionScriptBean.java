package systems.rcd.enonic.datatoolbox;

import java.util.function.Supplier;

import systems.rcd.fwk.core.format.json.RcdJsonService;
import systems.rcd.fwk.core.format.json.data.RcdJsonObject;

import com.enonic.xp.branch.Branch;
import com.enonic.xp.node.ApplyNodePermissionsParams;
import com.enonic.xp.node.ApplyNodePermissionsResult;
import com.enonic.xp.node.NodeId;
import com.enonic.xp.node.NodeService;
import com.enonic.xp.repository.RepositoryId;
import com.enonic.xp.script.bean.BeanContext;

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
                         boolean overwriteChildPermissions )
    {
        return runSafely( () -> {

            final ApplyNodePermissionsParams params = ApplyNodePermissionsParams.create().
                nodeId( NodeId.from( nodeId ) ).
                inheritPermissions( inheritPermissions ).
                overwriteChildPermissions( overwriteChildPermissions ).
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
}
