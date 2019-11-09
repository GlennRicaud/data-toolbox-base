package systems.rcd.enonic.datatoolbox;

import java.util.function.Supplier;

import systems.rcd.fwk.core.format.json.RcdJsonService;
import systems.rcd.fwk.core.format.json.data.RcdJsonArray;
import systems.rcd.fwk.core.format.json.data.RcdJsonObject;

import com.enonic.xp.blob.NodeVersionKey;
import com.enonic.xp.branch.Branch;
import com.enonic.xp.node.NodeId;
import com.enonic.xp.node.NodeService;
import com.enonic.xp.node.NodeVersionQuery;
import com.enonic.xp.node.NodeVersionQueryResult;
import com.enonic.xp.query.expr.FieldOrderExpr;
import com.enonic.xp.query.expr.OrderExpr;
import com.enonic.xp.repository.RepositoryId;
import com.enonic.xp.script.bean.BeanContext;

public class RcdVersionScriptBean
    extends RcdScriptBean
{
    private Supplier<NodeService> nodeServiceSupplier;

    @Override
    public void initialize( final BeanContext context )
    {
        nodeServiceSupplier = context.getService( NodeService.class );
    }

    public String list( final String repositoryName, final String nodeId, final Integer from, final Integer size )
    {
        return runSafely( () -> {

            final NodeVersionQuery nodeVersionQuery = NodeVersionQuery.create().
                nodeId( NodeId.from( nodeId ) ).
                from( from ).
                size( size ).
                addOrderBy( FieldOrderExpr.create( "timestamp", OrderExpr.Direction.DESC ) ).
                build();

            final NodeVersionQueryResult queryResult = createContext( RepositoryId.from( repositoryName ), Branch.from( "master" ) ).
                callWith( () -> nodeServiceSupplier.get().
                    findVersions( nodeVersionQuery ) );

            final RcdJsonObject result = RcdJsonService.createJsonObject().
                put( "total", queryResult.getTotalHits() );

            final RcdJsonArray hits = result.createArray( "hits" );
            queryResult.getNodeVersionsMetadata().forEach( nodeVersionMetadata -> {
                final NodeVersionKey nodeVersionKey = nodeVersionMetadata.getNodeVersionKey();
                final RcdJsonObject versionMeta = hits.createObject().
                    put( "versionId", nodeVersionMetadata.getNodeVersionId().toString() ).
                    put( "nodeBlobKey", nodeVersionKey.getNodeBlobKey().toString() ).
                    put( "indexConfigBlobKey", nodeVersionKey.getIndexConfigBlobKey().toString() ).
                    put( "accessControlBlobKey", nodeVersionKey.getAccessControlBlobKey().toString() ).
                    put( "nodeId", nodeVersionMetadata.getNodeId().toString() ).
                    put( "nodePath", nodeVersionMetadata.getNodePath().toString() ).
                    put( "nodeCommitId", nodeVersionMetadata.getNodeCommitId() == null ? null : nodeVersionMetadata.getNodeCommitId().toString() ).
                    put( "timestamp", nodeVersionMetadata.getTimestamp().toString() );
            } );

            return createSuccessResult( result );
        }, "Error while retrieving versions" );
    }
}
