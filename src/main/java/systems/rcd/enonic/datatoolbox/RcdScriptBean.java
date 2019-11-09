package systems.rcd.enonic.datatoolbox;

import java.util.function.Function;
import java.util.function.Supplier;
import java.util.stream.Stream;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import systems.rcd.fwk.core.format.json.RcdJsonService;
import systems.rcd.fwk.core.format.json.data.RcdJsonArray;
import systems.rcd.fwk.core.format.json.data.RcdJsonObject;
import systems.rcd.fwk.core.format.json.data.RcdJsonValue;

import com.enonic.xp.branch.Branch;
import com.enonic.xp.context.Context;
import com.enonic.xp.context.ContextAccessor;
import com.enonic.xp.context.ContextBuilder;
import com.enonic.xp.export.NodeImportResult;
import com.enonic.xp.lib.task.TaskProgressHandler;
import com.enonic.xp.repository.RepositoryId;
import com.enonic.xp.script.bean.BeanContext;
import com.enonic.xp.script.bean.ScriptBean;

public class RcdScriptBean
    implements ScriptBean
{
    protected static final Logger LOGGER = LoggerFactory.getLogger( RcdScriptBean.class );

    protected static final long RESULT_DETAILS_COUNT = 100;

    @Override
    public void initialize( final BeanContext context )
    {
    }

    protected String runSafely( final Supplier<RcdJsonValue> supplier, final String errorMessage )
    {
        return runSafely( supplier, errorMessage, null );
    }

    protected String runSafely( final Supplier<RcdJsonValue> supplier, final String errorMessage, final Runnable finallyCallback )
    {
        try
        {
            return RcdJsonService.toString( supplier.get() );
        }
        catch ( Exception e )
        {
            LOGGER.error( errorMessage, e );
            return RcdJsonService.toString( createErrorResult( errorMessage ) );
        }
        finally
        {
            if ( finallyCallback != null )
            {
                finallyCallback.run();
            }
        }
    }

    protected String runSafelyNoDependency( final Supplier<String> supplier, final String errorMessage )
    {
        try
        {
            return supplier.get();
        }
        catch ( Exception e )
        {
            LOGGER.error( errorMessage, e );
            return "{\"error\":\"" + errorMessage + "\"}";
        }
    }

    protected RcdJsonValue createErrorResult( final String errorMessage )
    {
        return RcdJsonService.createJsonObject().
            put( "error", errorMessage );
    }

    protected RcdJsonValue createSuccessResult()
    {
        return RcdJsonService.createJsonObject().
            put( "success", true );
    }

    protected RcdJsonValue createSuccessResult( final RcdJsonValue successValue )
    {
        final RcdJsonValue success = RcdJsonService.createJsonObject().
            put( "success", successValue );
        return success;
    }

    protected void limitedAddAll( final Stream<? extends Object> from, final RcdJsonArray to, final Function<Object, String> converter )
    {
        from.limit( RESULT_DETAILS_COUNT ).
            forEach( error -> to.add( converter.apply( error ) ) );
        if ( to.size() == RESULT_DETAILS_COUNT )
        {
            to.add( "..." );
        }
    }

    protected RcdJsonValue convertNodeImportResultToJson( final NodeImportResult nodeImportResult )
    {
        final RcdJsonObject result = RcdJsonService.createJsonObject();

        result.put( "addedNodeCount", nodeImportResult.getAddedNodes().getSize() );
        result.put( "updatedNodeCount", nodeImportResult.getUpdateNodes().getSize() );
        result.put( "importedBinaryCount", nodeImportResult.getExportedBinaries().size() );
        result.put( "errorCount", nodeImportResult.getImportErrors().size() );

        final RcdJsonArray addedNodesResult = result.createArray( "addedNodes" );
        final RcdJsonArray updatedNodesResult = result.createArray( "updatedNodes" );
        final RcdJsonArray importedBinariesResult = result.createArray( "importedBinaries" );
        final RcdJsonArray errorsResult = result.createArray( "errors" );

        limitedAddAll( nodeImportResult.getAddedNodes().stream(), addedNodesResult, nodePath -> nodePath.toString() );
        limitedAddAll( nodeImportResult.getUpdateNodes().stream(), updatedNodesResult, nodePath -> nodePath.toString() );
        limitedAddAll( nodeImportResult.getExportedBinaries().stream(), importedBinariesResult, binary -> (String) binary );
        limitedAddAll( nodeImportResult.getImportErrors().stream(), errorsResult,
                       error -> ( (NodeImportResult.ImportError) error ).getMessage() + " - " +
                           ( (NodeImportResult.ImportError) error ).getException().toString() );

        return result;
    }

    protected void reportProgress( final String action, final int current, final int total )
    {
        final TaskProgressHandler taskProgressHandler = new TaskProgressHandler();
        taskProgressHandler.setInfo( action + ( total > 0 ? " (" + current + "/" + total + ")" : "" ) + "..." );
        taskProgressHandler.setCurrent( (double) current );
        taskProgressHandler.setTotal( (double) total );
        taskProgressHandler.reportProgress();
    }

    protected Context createContext( final RepositoryId repositoryId, final Branch branch )
    {
        return ContextBuilder.from( ContextAccessor.current() ).
            repositoryId( repositoryId ).
            branch( branch ).
            build();
    }
}
