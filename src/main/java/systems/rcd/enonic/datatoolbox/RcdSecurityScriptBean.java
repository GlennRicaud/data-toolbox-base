package systems.rcd.enonic.datatoolbox;

import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.function.Supplier;

import systems.rcd.fwk.core.format.json.RcdJsonService;
import systems.rcd.fwk.core.format.json.data.RcdJsonArray;
import systems.rcd.fwk.core.format.json.data.RcdJsonObject;

import com.enonic.xp.query.expr.ConstraintExpr;
import com.enonic.xp.query.expr.OrderExpr;
import com.enonic.xp.query.expr.QueryExpr;
import com.enonic.xp.query.parser.QueryParser;
import com.enonic.xp.script.bean.BeanContext;
import com.enonic.xp.security.IdProviderKey;
import com.enonic.xp.security.PrincipalQuery;
import com.enonic.xp.security.PrincipalQueryResult;
import com.enonic.xp.security.PrincipalType;
import com.enonic.xp.security.SecurityService;
import com.enonic.xp.security.User;
import com.enonic.xp.security.UserQuery;
import com.enonic.xp.security.UserQueryResult;

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

    public String queryUsers( final String idProviderKey, final int start, final int count, final String filter, final String sort )
    {
        return runSafely( () -> {

            final RcdJsonObject result = RcdJsonService.createJsonObject();

            final String constraintString = "userstorekey='" + idProviderKey + "'" + ( filter == null ? "" : " AND " + filter );
            final ConstraintExpr constraintExpr = QueryParser.parseCostraintExpression( constraintString );
            final List<OrderExpr> orderExpressions = QueryParser.parseOrderExpressions( sort == null ? "" : sort );
            final QueryExpr queryExpr = QueryExpr.from( constraintExpr, orderExpressions );

            final UserQuery userQuery = UserQuery.create().
                queryExpr( queryExpr ).
                from( start ).
                size( count ).
                build();
            final UserQueryResult queryResult = securityServiceSupplier.get().
                query( userQuery );

            result.put( "total", queryResult.getTotalSize() );
            final RcdJsonArray hitArray = result.createArray( "hits" );

            queryResult.getUsers().forEach( principal -> {
                final RcdJsonObject principalJson = hitArray.createObject().
                    put( "key", principal.getKey().toString() ).
                    put( "name", principal.getKey().getId() ).
                    put( "displayName", principal.getDisplayName() ).
                    put( "email", ( (User) principal ).getEmail() );
            } );

            return createSuccessResult( result );
        }, "Error while querying users" );
    }

    public String listGroups( final String idProviderKey, final int start, final int count )
    {
        return queryPrincipals( idProviderKey, Collections.singleton( PrincipalType.GROUP ), start, count, null );
    }

    private String queryPrincipals( final String idProviderKey, final Collection<PrincipalType> principalTypes, final int start,
                                    final int count, final String searchText )
    {
        return runSafely( () -> {

            final RcdJsonObject result = RcdJsonService.createJsonObject();

            final PrincipalQuery principalQuery = PrincipalQuery.create().
                searchText( searchText ).
                from( start ).
                size( count ).
                idProvider( IdProviderKey.from( idProviderKey ) ).
                includeTypes( principalTypes ).
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
        }, "Error while retrieving principal list" );
    }

    @Override
    public void initialize( final BeanContext context )
    {
        securityServiceSupplier = context.getService( SecurityService.class );
    }

}
