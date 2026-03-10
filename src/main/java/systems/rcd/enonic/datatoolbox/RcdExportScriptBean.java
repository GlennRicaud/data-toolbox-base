package systems.rcd.enonic.datatoolbox;

import com.enonic.xp.branch.Branch;
import com.enonic.xp.context.Context;
import com.enonic.xp.context.ContextAccessor;
import com.enonic.xp.context.ContextBuilder;
import com.enonic.xp.export.*;
import com.enonic.xp.home.HomeDir;
import com.enonic.xp.node.NodePath;
import com.enonic.xp.repository.RepositoryId;
import com.enonic.xp.script.bean.BeanContext;
import systems.rcd.fwk.core.exc.RcdException;
import systems.rcd.fwk.core.format.json.RcdJsonService;
import systems.rcd.fwk.core.format.json.data.RcdJsonArray;
import systems.rcd.fwk.core.format.json.data.RcdJsonObject;
import systems.rcd.fwk.core.format.json.data.RcdJsonValue;
import systems.rcd.fwk.core.io.file.RcdFileService;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.function.Supplier;

public class RcdExportScriptBean
    extends RcdDataScriptBean
{
    private Supplier<ExportService> exportServiceSupplier;

    private static final Path EXPORT_ARCHIVE_DIRECTORY_PATH;

    static
    {
        try
        {
            EXPORT_ARCHIVE_DIRECTORY_PATH = Files.createTempDirectory( "export-archives-" );
            LOGGER.debug( "Created export archive directory:" + EXPORT_ARCHIVE_DIRECTORY_PATH.toAbsolutePath() );
        }
        catch ( IOException e )
        {
            throw new RcdException( "Error while creating export archive directory", e );
        }
    }

    @Override
    public void initialize( final BeanContext context )
    {
        exportServiceSupplier = context.getService( ExportService.class );
    }

    public String list()
    {
        return runSafely( () -> {
            final RcdJsonArray exportJsonArray = RcdJsonService.createJsonArray();

            final Path exportDirectoryPath = getDirectoryPath();
            if ( exportDirectoryPath.toFile().exists() )
            {
                RcdFileService.listSubPaths( exportDirectoryPath, exportPath -> {
                    if ( isArchived(exportPath) )
                    {
                        final RcdJsonObject export = RcdJsonService.createJsonObject().
                            put( "name", exportPath.getFileName().toString() ).
                            put( "timestamp", exportPath.toFile().lastModified() );
                        //put( "size", RcdFileService.getSize( exportPath ) );
                        exportJsonArray.add( export );
                    }
                } );
            }
            return createSuccessResult( exportJsonArray );
        }, "Error while listing exports" );
    }

    public String create( final String repositoryName, final String branchName, final String nodePath, final String exportName )
    {
        return runSafely( () -> {
            final NodeExportListener nodeExportListener = createNodeExportListener();
            final ExportNodesParams exportNodesParams = ExportNodesParams.create().
                sourceNodePath( new NodePath(nodePath) ).
                exportName( exportName).
                nodeExportListener( nodeExportListener ).
                build();

            final NodeExportResult nodeExportResult = createContext( repositoryName, branchName ).
                callWith( () -> exportServiceSupplier.get().exportNodes( exportNodesParams ) );
            final RcdJsonValue result = convertNodeExportResultToJson( nodeExportResult );
            return createSuccessResult( result );
        }, "Error while creating export" );
    }

    private NodeExportListener createNodeExportListener()
    {
        return new NodeExportListener()
        {
            private String action = "Exporting nodes";

            private int currentProgress = 0;

            private int totalProgress = 0;

            @Override
            public void nodeExported( final int count )
            {
                currentProgress += count;
                reportProgress( action, currentProgress, totalProgress );
            }

            @Override
            public void nodeResolved( final int count )
            {
                totalProgress = (int) count;
                reportProgress( action, currentProgress, totalProgress );
            }
        };
    }

    private RcdJsonValue convertNodeExportResultToJson( final NodeExportResult nodeExportResult )
    {
        final RcdJsonObject result = RcdJsonService.createJsonObject();

        result.put( "exportedNodeCount", nodeExportResult.getExportedNodes().getSize() );
        result.put( "exportedBinaryCount", nodeExportResult.getExportedBinaries().size() );
        result.put( "errorCount", nodeExportResult.getExportErrors().size() );

        final RcdJsonArray exportedNodesResult = result.createArray( "exportedNodes" );
        final RcdJsonArray exportedBinariesResult = result.createArray( "exportedBinaries" );
        final RcdJsonArray errorsResult = result.createArray( "errors" );

        limitedAddAll( nodeExportResult.getExportedNodes().stream(), exportedNodesResult, nodePath -> nodePath.toString() );
        limitedAddAll( nodeExportResult.getExportedBinaries().stream(), exportedBinariesResult, binary -> (String) binary );
        limitedAddAll( nodeExportResult.getExportErrors().stream(), errorsResult, error -> error.toString() );

        return result;
    }

    public String load( final String[] exportNames, final String repositoryName, final String branchName, final String nodePathString )
    {
        return runSafely( () -> {
            final RcdJsonObject results = RcdJsonService.createJsonObject();
            final NodePath nodePath = new NodePath( nodePathString );
            createContext( repositoryName, branchName ).runWith( () -> {
                for ( String exportName : exportNames )
                {
                    final NodeImportListener nodeImportListener =
                        createNodeImportListener( ( exportNames.length > 1 ? "Export: " + exportName + "\n" : "" ) + "Importing nodes" );
                    final NodeImportResult nodeImportResult = load( nodePath, exportName, nodeImportListener );
                    final RcdJsonValue result = convertNodeImportResultToJson( nodeImportResult );
                    results.put( exportName, result );

                }
            } );

            return createSuccessResult( results );
        }, "Error while loading export" );
    }

    private NodeImportListener createNodeImportListener( final String actionString )
    {
        return new NodeImportListener()
        {
            private String action = actionString;

            private int currentProgress = 0;

            private int totalProgress = 0;

            @Override
            public void nodeImported( final int count )
            {
                currentProgress += count;
                reportProgress( action, currentProgress, totalProgress );
            }

            @Override
            public void nodeResolved( final int count )
            {
                currentProgress = 0;
                totalProgress = count;
                reportProgress( action, currentProgress, totalProgress );
            }

            @Override
            public void nodeSkipped( final int count) {
                currentProgress += count;
                reportProgress( action, currentProgress, totalProgress );
            }
        };
    }

    public String delete( final String... exportNames )
    {
        return runSafely( () -> {
            for ( int i = 0; i < exportNames.length; i++ )
            {
                final String exportName = exportNames[i];
                reportProgress( "Deleting exports", i, exportNames.length );
                final Path exportPath = getDirectoryPath().resolve( exportName );
                RcdFileService.delete( exportPath );
            }
            return createSuccessResult();
        }, "Error while deleting export" );
    }

    private NodeImportResult load( final NodePath nodePath, final String exportName, final NodeImportListener nodeImportListener )
    {
        final String exportNameRoot = exportName.substring( 0, exportName.length() - ".zip".length() );

        final ImportNodesParams importNodesParams = ImportNodesParams.create().
            targetNodePath( nodePath ).
            exportName( exportNameRoot ).
            includeNodeIds( true ).
            includePermissions( true ).
            nodeImportListener( nodeImportListener ).
            build();

        return exportServiceSupplier.get().
            importNodes( importNodesParams );
    }

    @Override
    protected Path getArchiveDirectoryPath()
    {
        return EXPORT_ARCHIVE_DIRECTORY_PATH;
    }

    @Override
    protected Path getDirectoryPath()
    {
        return HomeDir.get().
            toFile().
            toPath().
            resolve( "data/export" );
    }

    @Override
    protected String getType()
    {
        return "export";
    }

    private Context createContext( final String repositoryName, final String branch )
    {
        return ContextBuilder.from( ContextAccessor.current() ).
            repositoryId( RepositoryId.from( repositoryName ) ).
            branch( Branch.from( branch ) ).
            build();
    }
}
