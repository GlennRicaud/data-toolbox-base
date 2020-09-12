package systems.rcd.enonic.datatoolbox;

import java.util.HashMap;
import java.util.Map;
import java.util.function.Supplier;

import systems.rcd.fwk.core.format.json.RcdJsonService;
import systems.rcd.fwk.core.format.json.data.RcdJsonArray;
import systems.rcd.fwk.core.format.json.data.RcdJsonObject;

import com.enonic.xp.audit.AuditLog;
import com.enonic.xp.audit.AuditLogService;
import com.enonic.xp.audit.FindAuditLogParams;
import com.enonic.xp.audit.FindAuditLogResult;
import com.enonic.xp.data.PropertySet;
import com.enonic.xp.script.bean.BeanContext;
import com.enonic.xp.security.PrincipalKey;
import com.enonic.xp.security.SecurityService;
import com.enonic.xp.security.User;

public class RcdAuditScriptBean
    extends RcdScriptBean
{
    private Supplier<AuditLogService> auditLogServiceSupplier;

    private Supplier<SecurityService> securityServiceSupplier;

    public String query( final Integer start, final Integer count )
    {
        return runSafely( () -> {
            final RcdJsonObject result = RcdJsonService.createJsonObject();

            final FindAuditLogParams params = FindAuditLogParams.create().
                start( start ).
                count( count ).
                build();
            final FindAuditLogResult findAuditLogResult = auditLogServiceSupplier.get().
                find( params );
            result.put( "total", findAuditLogResult.getTotal() );

            final Map<PrincipalKey, String> userDisplayNameMap = new HashMap<>();
            final RcdJsonArray hitArray = result.createArray( "hits" );
            findAuditLogResult.getHits().
                forEach( hit -> {
                    final PrincipalKey userKey = hit.getUser();
                    final String userDisplayName = userDisplayNameMap.computeIfAbsent( userKey, this::getUserDisplayName );
                    final RcdJsonObject hitObject = hitArray.createObject();
                    hitObject.put( "id", hit.getId().toString() ).
                        put( "user", userDisplayName == null ? hit.getUser().toString() : userDisplayName ).
                        put( "action", getAction( hit ) ).
                        put( "target", getTarget( hit ) ).
                        put( "time", hit.getTime().toEpochMilli() );
                    final RcdJsonArray objectArray = hitObject.createArray( "objects" );
                    hit.getObjectUris().forEach( auditLogUri -> objectArray.add( auditLogUri.getValue() ) );
                } );

            return createSuccessResult( result );
        }, "Error while retrieving audit log" );
    }

    private String getAction( final AuditLog record )
    {
        switch ( record.getType() )
        {
            case "system.content.create":
                return "created";
            case "system.content.update":
                return "updated";
            case "system.content.delete":
                return record.getData().getSet( "params" ).hasProperty( "contentPath" ) ? "deleted" : "undeleted";
            case "system.content.publish":
                return "published";
            case "system.content.unpublishContent":
                return "unpublished";
            case "system.content.duplicate":
                return "duplicated";
            case "system.content.move":
                return "moved";
            case "system.content.rename":
                return "renamed";
            case "system.content.setActiveContentVersion":
                return "changed active version for";
            case "system.content.setChildOrder":
                return "changed child order for";
            case "system.content.reorderChildren":
                return "reordered children for";
            case "system.content.applyPermissions":
                return "applied permissions for";
            case "system.content.reprocess":
                return "reprocessed";
            default:
                return "[" + record.getType() + "]";
        }
    }

    private String getTarget( final AuditLog record )
    {

        if ( record.getType().startsWith( "system.content." ) )
        {
            final PropertySet params = record.getData().getSet( "params" );
            final PropertySet result = record.getData().getSet( "result" );
            switch ( record.getType() )
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
                        final int undeletedCount = record.getData().getProperties( "result" ).size();
                        return undeletedCount + " content(s)";
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
                    return "content [" + result.getString( "contentId" ) + "] (" + result.getLong( "size" ) + " reordered)";
                case "system.content.applyPermissions":
                    return "content [" + result.getString( "contentId" ) + "] (" + result.getProperties( "succeedContents" ).size() +
                        " changed)";
            }
        }

        final int objectCount = record.getObjectUris().getSize();
        if ( objectCount == 0 )
        {
            return "";
        }
        if ( objectCount == 1 )
        {
            return record.getObjectUris().
                first().
                getValue();
        }
        return objectCount + " objects";
    }

    private String getUserDisplayName( final PrincipalKey userKey )
    {
        return securityServiceSupplier.get().
            getUser( userKey ).
            map( User::getDisplayName ).
            orElse( userKey.toString() );
    }

    @Override
    public void initialize( final BeanContext context )
    {
        this.auditLogServiceSupplier = context.getService( AuditLogService.class );
        this.securityServiceSupplier = context.getService( SecurityService.class );
    }
}
