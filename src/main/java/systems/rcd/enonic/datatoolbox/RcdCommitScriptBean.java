package systems.rcd.enonic.datatoolbox;

import java.util.function.Supplier;

import systems.rcd.fwk.core.format.json.RcdJsonService;
import systems.rcd.fwk.core.format.json.data.RcdJsonObject;

import com.enonic.xp.branch.Branch;
import com.enonic.xp.node.NodeCommitEntry;
import com.enonic.xp.node.NodeCommitId;
import com.enonic.xp.node.NodeService;
import com.enonic.xp.repository.RepositoryId;
import com.enonic.xp.script.bean.BeanContext;

public class RcdCommitScriptBean
    extends RcdScriptBean
{
    private Supplier<NodeService> nodeServiceSupplier;

    @Override
    public void initialize( final BeanContext context )
    {
        nodeServiceSupplier = context.getService( NodeService.class );
    }

    public String get( final String repositoryName, final String nodeCommitId )
    {
        return runSafely( () -> {
            final NodeCommitEntry nodeCommitEntry = createContext( RepositoryId.from( repositoryName ), Branch.from( "master" ) ).
                callWith( () -> nodeServiceSupplier.get().
                    getCommit( NodeCommitId.from( nodeCommitId ) ) );
            final RcdJsonObject result = RcdJsonService.createJsonObject().
                put( "nodeCommitId", nodeCommitEntry.getNodeCommitId().toString() ).
                put( "message", nodeCommitEntry.getMessage() ).
                put( "committer", nodeCommitEntry.getCommitter().toString() ).
                put( "timestamp", nodeCommitEntry.getTimestamp().toString() );
            return createSuccessResult( result );
        }, "Error while retrieving commit" );
    }
}
