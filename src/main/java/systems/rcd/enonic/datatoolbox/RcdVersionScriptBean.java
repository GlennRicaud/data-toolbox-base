package systems.rcd.enonic.datatoolbox;

import java.util.List;
import java.util.Map;
import java.util.function.Supplier;
import java.util.stream.Collectors;

import systems.rcd.fwk.core.format.json.RcdJsonService;
import systems.rcd.fwk.core.format.json.data.RcdJsonArray;
import systems.rcd.fwk.core.format.json.data.RcdJsonObject;

import com.enonic.xp.blob.NodeVersionKey;
import com.enonic.xp.branch.Branch;
import com.enonic.xp.branch.Branches;
import com.enonic.xp.context.Context;
import com.enonic.xp.node.GetActiveNodeVersionsParams;
import com.enonic.xp.node.NodeId;
import com.enonic.xp.node.NodeService;
import com.enonic.xp.node.NodeVersionId;
import com.enonic.xp.node.NodeVersionQuery;
import com.enonic.xp.node.NodeVersionQueryResult;
import com.enonic.xp.query.expr.FieldOrderExpr;
import com.enonic.xp.query.expr.OrderExpr;
import com.enonic.xp.repository.RepositoryId;
import com.enonic.xp.repository.RepositoryService;
import com.enonic.xp.script.bean.BeanContext;

public class RcdVersionScriptBean
    extends RcdScriptBean
{
    private Supplier<NodeService> nodeServiceSupplier;

    private Supplier<RepositoryService> repositoryServiceSupplier;

    @Override
    public void initialize( final BeanContext context )
    {
        nodeServiceSupplier = context.getService( NodeService.class );
        repositoryServiceSupplier = context.getService( RepositoryService.class );
    }

    public String list( final String repositoryName, final String nodeIdString, final Integer from, final Integer size )
    {
        return runSafely( () -> {

            final RepositoryId repositoryId = RepositoryId.from( repositoryName );
            final NodeId nodeId = NodeId.from( nodeIdString );
            final Context context = createContext( repositoryId, Branch.from( "master" ) );

            final NodeVersionQuery nodeVersionQuery = NodeVersionQuery.create().
                nodeId( nodeId ).
                from( from ).
                size( size ).
                addOrderBy( FieldOrderExpr.create( "timestamp", OrderExpr.Direction.DESC ) ).
                build();
            final NodeVersionQueryResult versionQueryResult = context.callWith( () -> nodeServiceSupplier.get().
                findVersions( nodeVersionQuery ) );

            final Branches branches = repositoryServiceSupplier.get().get( repositoryId ).getBranches();
            final GetActiveNodeVersionsParams getActiveNodeVersionsParams = GetActiveNodeVersionsParams.create().
                nodeId( nodeId ).
                branches( branches ).
                build();
            final Map<NodeVersionId, List<Branch>> branchesByCommitId = context.callWith( () -> nodeServiceSupplier.get().
                getActiveVersions( getActiveNodeVersionsParams ) ).
                getNodeVersions().
                entrySet().
                stream().
                collect( Collectors.groupingBy( entry -> entry.getValue().getNodeVersionId(),
                                                Collectors.mapping( entry -> entry.getKey(), Collectors.toList() ) ) );

            final RcdJsonObject result = RcdJsonService.createJsonObject().
                put( "total", versionQueryResult.getTotalHits() );
            final RcdJsonArray hits = result.createArray( "hits" );
            versionQueryResult.getNodeVersionsMetadata().forEach( nodeVersionMetadata -> {
                final NodeVersionKey nodeVersionKey = nodeVersionMetadata.getNodeVersionKey();
                final RcdJsonObject nodeVersion = hits.createObject().
                    put( "versionId", nodeVersionMetadata.getNodeVersionId().toString() ).
                    put( "nodeBlobKey", nodeVersionKey.getNodeBlobKey().toString() ).
                    put( "indexConfigBlobKey", nodeVersionKey.getIndexConfigBlobKey().toString() ).
                    put( "accessControlBlobKey", nodeVersionKey.getAccessControlBlobKey().toString() ).
                    put( "nodeId", nodeVersionMetadata.getNodeId().toString() ).
                    put( "nodePath", nodeVersionMetadata.getNodePath().toString() ).
                    put( "nodeCommitId",
                         nodeVersionMetadata.getNodeCommitId() == null ? null : nodeVersionMetadata.getNodeCommitId().toString() ).
                    put( "timestamp", nodeVersionMetadata.getTimestamp().toString() );

                final List<Branch> activeInBranchList = branchesByCommitId.get( nodeVersionMetadata.getNodeVersionId() );
                if ( activeInBranchList != null )
                {
                    final RcdJsonArray branchJsonArray = nodeVersion.createArray( "branches" );
                    activeInBranchList.forEach( branch -> branchJsonArray.add( branch.getValue() ) );
                }
            } );

            return createSuccessResult( result );
        }, "Error while retrieving versions" );
    }
}
