package systems.rcd.enonic.datatoolbox;

import java.util.HashMap;
import java.util.Map;
import java.util.function.Supplier;

import systems.rcd.fwk.core.format.json.RcdJsonService;
import systems.rcd.fwk.core.format.json.data.RcdJsonArray;
import systems.rcd.fwk.core.format.json.data.RcdJsonObject;
import systems.rcd.fwk.core.format.json.data.RcdJsonValue;

import com.enonic.xp.branch.Branch;
import com.enonic.xp.context.ContextAccessor;
import com.enonic.xp.context.ContextBuilder;
import com.enonic.xp.data.PropertySet;
import com.enonic.xp.data.ValueFactory;
import com.enonic.xp.node.FindNodesByQueryResult;
import com.enonic.xp.node.Node;
import com.enonic.xp.node.NodeIndexPath;
import com.enonic.xp.node.NodeQuery;
import com.enonic.xp.node.NodeService;
import com.enonic.xp.query.expr.FieldOrderExpr;
import com.enonic.xp.query.expr.OrderExpr;
import com.enonic.xp.query.filter.ValueFilter;
import com.enonic.xp.repository.RepositoryId;
import com.enonic.xp.script.bean.BeanContext;
import com.enonic.xp.security.PrincipalKey;
import com.enonic.xp.security.SecurityService;
import com.enonic.xp.security.User;

public class RcdAuditScriptBean
    extends RcdScriptBean
{
    private Supplier<NodeService> nodeServiceSupplier;

    private Supplier<SecurityService> securityServiceSupplier;

    public String query( final int start, final int count )
    {
        return runSafely(
            () -> ContextBuilder.from( ContextAccessor.current() ).repositoryId( RepositoryId.from( "system.auditlog" ) ).branch(
                Branch.from( "master" ) ).build().callWith( () -> this.doQuery( start, count ) ), "Error while retrieving audit log" );
    }

    public RcdJsonValue doQuery( final int start, final int count )
    {
        final RcdJsonObject result = RcdJsonService.createJsonObject();

        final NodeQuery nodeQuery = NodeQuery.create().addQueryFilter(
            ValueFilter.create().fieldName( NodeIndexPath.NODE_TYPE.toString() ).addValue(
                ValueFactory.newString( "auditlog" ) ).build() ).addOrderBy(
            FieldOrderExpr.create( "time", OrderExpr.Direction.DESC ) ).from( start ).size( count ).build();
        final FindNodesByQueryResult findNodesByQueryResult = nodeServiceSupplier.get().findByQuery( nodeQuery );
        result.put( "total", findNodesByQueryResult.getTotalHits() );

        final Map<String, String> userDisplayNameMap = new HashMap<>();
        final RcdJsonArray hitArray = result.createArray( "hits" );
        findNodesByQueryResult.getNodeHits().forEach( nodeHit -> {
            final Node node = nodeServiceSupplier.get().getById( nodeHit.getNodeId() );
            final PropertySet nodeData = node.data().getRoot();

            final String userKey = nodeData.getString( "user" );
            final String userDisplayName = userDisplayNameMap.computeIfAbsent( userKey, this::getUserDisplayName );
            final RcdJsonObject hitObject = hitArray.createObject();
            hitObject.put( "id", node.id().toString() ).put( "user", userDisplayName == null ? userKey : userDisplayName ).put( "action",
                                                                                                                                getAction(
                                                                                                                                    nodeData ) ).put(
                "target", getTarget( nodeData ) ).put( "time", nodeData.getInstant( "time" ).toEpochMilli() );
            final RcdJsonArray objectArray = hitObject.createArray( "objects" );
            nodeData.getStrings( "objects" ).forEach( objectArray::add );
        } );

        return createSuccessResult( result );
    }

    private String getAction( final PropertySet record )
    {
        final String recordType = record.getString( "type" );
        switch ( recordType )
        {
            case "system.content.applyPermissions":
                return "applied permissions for";
            case "system.content.archive":
                return "archived";
            case "system.content.create":
                return "created";
            case "system.content.delete":
                return record.getSet( "data" ).getSet( "params" ).hasProperty( "contentPath" ) ? "deleted" : "undeleted";
            case "system.content.duplicate":
                return "duplicated";
            case "system.content.move":
                return "moved";
            case "system.content.publish":
                return "published";
            case "system.content.rename":
                return "renamed";
            case "system.content.reorderChildren":
                return "reordered children for";
            case "system.content.reprocess":
                return "reprocessed";
            case "system.content.restore":
                return "restored";
            case "system.content.setActiveContentVersion":
                return "changed active version for";
            case "system.content.setChildOrder":
                return "changed child order for";
            case "system.content.update":
                return "updated";
            case "system.content.unpublishContent":
                return "unpublished";
            case "system.job.create":
                return "created the job";
            case "system.job.delete":
                return "deleted the job";
            case "system.job.update":
                return "updated the job";
            default:
                return "[" + recordType + "]";
        }
    }

    private String getTarget( final PropertySet record )
    {
        final String recordType = record.getString( "type" );
        if ( recordType.startsWith( "system.content." ) )
        {
            final PropertySet params = record.getSet( "data" ).getSet( "params" );
            final PropertySet result = record.getSet( "data" ).getSet( "result" );
            switch ( recordType )
            {
                case "system.content.create":
                case "system.content.update":
                case "system.content.setChildOrder":
                case "system.content.reprocess":
                    return "content [" + result.getString( "path" ) + "] [" + result.getString( "id" ) + "]";
                case "system.content.delete":
                    if ( params.hasProperty( "contentPath" ) )
                    {
                        final String contentPath = params.getString( "contentPath" );
                        final int deletedCount = result.getProperties( "deletedContents" ).size();
                        final int pendingCount = result.getProperties( "pendingContents" ).size();
                        return " content [" + contentPath + "] (" + deletedCount + " deleted, " + pendingCount + " pending)";
                    }
                    else
                    {
                        final int undeletedCount = record.getSet( "data" ).getProperties( "result" ).size();
                        return undeletedCount + " pending content(s)";
                    }
                case "system.content.publish":
                    final int pushedCount = result.getProperties( "pushedContents" ).size();
                    final int deletedCount = result.getProperties( "deletedContents" ).size();
                    return ( pushedCount + deletedCount ) + " contents (" + pushedCount + " pushed, " + deletedCount + " deleted)";
                case "system.content.unpublishContent":
                    return result.getProperties( "unpublishedContents" ).size() + " content(s)";
                case "system.content.duplicate":
                    return "content [" + params.getString( "contentId" ) + "] (" + result.getProperties( "duplicatedContents" ).size() +
                        " duplicated)";
                case "system.content.move":
                    return "content [" + params.getString( "contentId" ) + "] under [" + params.getString( "parentContentPath" ) + "] (" +
                        result.getProperties( "movedContents" ).size() + " moved)";
                case "system.content.rename":
                    return "content [" + params.getString( "contentId" ) + "] to [" + result.getString( "path" ) + "]";
                case "system.content.setActiveContentVersion":
                    return "content [" + result.getString( "contentId" ) + "]";
                case "system.content.reorderChildren":
                    return "content [" + params.getString( "contentId" ) + "] (" + result.getLong( "size" ) + " reordered)";
                case "system.content.applyPermissions":
                    return "content [" + params.getString( "contentId" ) + "] (" + result.getProperties( "succeedContents" ).size() +
                        " changed)";
            }
        }

        final int objectCount = record.getProperties( "objects" ).size();
        if ( objectCount == 0 )
        {
            return "";
        }
        if ( objectCount == 1 )
        {
            return record.getString( "objects" );
        }
        return objectCount + " objects";
    }

    private String getUserDisplayName( final String userKey )
    {
        return securityServiceSupplier.get().getUser( PrincipalKey.from( userKey ) ).map( User::getDisplayName ).orElse(
            userKey.toString() );
    }

    @Override
    public void initialize( final BeanContext context )
    {
        this.nodeServiceSupplier = context.getService( NodeService.class );
        this.securityServiceSupplier = context.getService( SecurityService.class );
    }
}
