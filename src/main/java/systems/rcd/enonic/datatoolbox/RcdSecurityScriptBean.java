package systems.rcd.enonic.datatoolbox;

import java.util.function.Supplier;

import systems.rcd.fwk.core.format.json.RcdJsonService;
import systems.rcd.fwk.core.format.json.data.RcdJsonArray;
import systems.rcd.fwk.core.format.json.data.RcdJsonObject;

import com.enonic.xp.script.bean.BeanContext;
import com.enonic.xp.security.IdProviderKey;
import com.enonic.xp.security.PrincipalQuery;
import com.enonic.xp.security.PrincipalQueryResult;
import com.enonic.xp.security.SecurityService;

public class RcdSecurityScriptBean
    extends RcdScriptBean
{
    private Supplier<SecurityService> securityServiceSupplier;

    public String listIdProviders()
    {
        return runSafely( () -> {

            final RcdJsonArray idProviderArray = RcdJsonService.createJsonArray();

            securityServiceSupplier.get().
                getIdProviders().
                forEach( idProvider -> {
                    idProviderArray.createObject().
                        put( "key", idProvider.getKey().toString() ).
                        put( "displayName", idProvider.getDisplayName() );
                } );

            return createSuccessResult( idProviderArray );
        }, "Error while retrieving ID provider list" );
    }

    public String listUsers( final String idProviderKey )
    {
        return runSafely( () -> {

            final RcdJsonObject result = RcdJsonService.createJsonObject();

            final PrincipalQuery principalQuery = PrincipalQuery.create().
                from( 0 ).
                size( 100 ).
                idProvider( IdProviderKey.from( idProviderKey ) ).
                includeUsers().
                build();
            final PrincipalQueryResult queryResult = securityServiceSupplier.get().
                query( principalQuery );

            result.put( "total", queryResult.getTotalSize() );
            final RcdJsonArray hitArray = result.createArray( "hits" );

            queryResult.getPrincipals().forEach( principal -> {
                hitArray.createObject().
                    put( "key", principal.getKey().toString() ).
                    put( "name", principal.getKey().getId() ).
                    put( "displayName", principal.getDisplayName() );
            } );

            return createSuccessResult( result );
        }, "Error while retrieving user list" );
    }

    @Override
    public void initialize( final BeanContext context )
    {
        securityServiceSupplier = context.getService( SecurityService.class );
    }

}
