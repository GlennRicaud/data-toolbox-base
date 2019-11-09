package systems.rcd.enonic.datatoolbox;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.function.Supplier;

import systems.rcd.fwk.core.exc.RcdException;
import systems.rcd.fwk.core.format.json.RcdJsonService;
import systems.rcd.fwk.core.format.json.data.RcdJsonArray;
import systems.rcd.fwk.core.format.json.data.RcdJsonObject;
import systems.rcd.fwk.core.format.json.data.RcdJsonValue;
import systems.rcd.fwk.core.io.file.RcdFileService;

import com.enonic.xp.branch.Branch;
import com.enonic.xp.context.Context;
import com.enonic.xp.context.ContextAccessor;
import com.enonic.xp.context.ContextBuilder;
import com.enonic.xp.export.ExportNodesParams;
import com.enonic.xp.export.ExportService;
import com.enonic.xp.export.ImportNodesParams;
import com.enonic.xp.export.NodeExportListener;
import com.enonic.xp.export.NodeExportResult;
import com.enonic.xp.export.NodeImportListener;
import com.enonic.xp.export.NodeImportResult;
import com.enonic.xp.home.HomeDir;
import com.enonic.xp.node.NodePath;
import com.enonic.xp.repository.CreateRepositoryParams;
import com.enonic.xp.repository.NodeRepositoryService;
import com.enonic.xp.repository.Repository;
import com.enonic.xp.repository.RepositoryId;
import com.enonic.xp.repository.RepositoryService;
import com.enonic.xp.script.bean.BeanContext;
import com.enonic.xp.security.SystemConstants;
import com.enonic.xp.vfs.VirtualFiles;

public class RcdExportScriptBean
    extends RcdDataScriptBean
{
    private Supplier<ExportService> exportServiceSupplier;

    private Supplier<RepositoryService> repositoryServiceSupplier;

    private Supplier<NodeRepositoryService> nodeRepositoryServiceSupplier;

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
        repositoryServiceSupplier = context.getService( RepositoryService.class );
        nodeRepositoryServiceSupplier = context.getService( NodeRepositoryService.class );
    }

    public String list()
    {
        return runSafely( () -> {
            final RcdJsonArray exportJsonArray = RcdJsonService.createJsonArray();

            final Path exportDirectoryPath = getDirectoryPath();
            if ( exportDirectoryPath.toFile().exists() )
            {
                RcdFileService.listSubPaths( exportDirectoryPath, exportPath -> {
                    if ( exportPath.toFile().isDirectory() )
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
                sourceNodePath( NodePath.create( nodePath ).build() ).
                targetDirectory( getDirectoryPath().resolve( exportName ).toString() ).
                dryRun( false ).
                includeNodeIds( true ).
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
            public void nodeExported( final long count )
            {
                currentProgress += count;
                reportProgress( action, currentProgress, totalProgress );
            }

            @Override
            public void nodeResolved( final long count )
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
            final NodePath nodePath = NodePath.create( nodePathString ).build();
            createContext( repositoryName, branchName ).runWith( () -> {
                for ( String exportName : exportNames )
                {
                    final NodeImportListener nodeImportListener =
                        createNodeImportListener( ( exportNames.length > 1 ? "Export: " + exportName + "<br/>" : "" ) + "Importing nodes" );
                    final NodeImportResult nodeImportResult = load( nodePath, exportName, nodeImportListener );
                    final RcdJsonValue result = convertNodeImportResultToJson( nodeImportResult );
                    results.put( exportName, result );

                }
                if ( SystemConstants.SYSTEM_REPO.getId().toString().equals( repositoryName ) &&
                    SystemConstants.BRANCH_SYSTEM.getValue().equals( branchName ) )
                {
                    initializeStoredRepositories();
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
            public void nodeImported( final long count )
            {
                currentProgress += count;
                reportProgress( action, currentProgress, totalProgress );
            }

            @Override
            public void nodeResolved( final long count )
            {
                currentProgress = 0;
                totalProgress = (int) count;
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
        final ImportNodesParams importNodesParams = ImportNodesParams.create().
            targetNodePath( nodePath ).
            source( VirtualFiles.from( getDirectoryPath().resolve( exportName ) ) ).
            dryRun( false ).
            includeNodeIds( true ).
            includePermissions( true ).
            nodeImportListener( nodeImportListener ).
            build();

        return exportServiceSupplier.get().
            importNodes( importNodesParams );
    }

    private void initializeStoredRepositories()
    {
        repositoryServiceSupplier.get().invalidateAll();
        for ( Repository repository : repositoryServiceSupplier.get().list() )
        {
            if ( !nodeRepositoryServiceSupplier.get().isInitialized( repository.getId() ) )
            {
                final CreateRepositoryParams createRepositoryParams = CreateRepositoryParams.create().
                    repositoryId( repository.getId() ).
                    repositorySettings( repository.getSettings() ).
                    build();
                nodeRepositoryServiceSupplier.get().create( createRepositoryParams );
            }
        }
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
