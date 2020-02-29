package systems.rcd.enonic.datatoolbox;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Iterator;
import java.util.List;
import java.util.function.Supplier;

import jdk.nashorn.api.scripting.JSObject;
import systems.rcd.fwk.core.exc.RcdException;
import systems.rcd.fwk.core.format.json.RcdJsonService;
import systems.rcd.fwk.core.format.json.data.RcdJsonArray;
import systems.rcd.fwk.core.format.json.data.RcdJsonObject;
import systems.rcd.fwk.core.format.json.data.RcdJsonValue;
import systems.rcd.fwk.core.format.properties.RcdPropertiesService;
import systems.rcd.fwk.core.io.file.RcdFileService;
import systems.rcd.fwk.core.io.file.RcdTextFileService;
import systems.rcd.fwk.core.io.file.params.RcdReadTextFileParams;
import systems.rcd.fwk.core.script.js.RcdJavascriptService;

import com.enonic.xp.branch.Branch;
import com.enonic.xp.dump.BranchDumpResult;
import com.enonic.xp.dump.BranchLoadResult;
import com.enonic.xp.dump.DumpError;
import com.enonic.xp.dump.DumpService;
import com.enonic.xp.dump.DumpUpgradeResult;
import com.enonic.xp.dump.LoadError;
import com.enonic.xp.dump.RepoDumpResult;
import com.enonic.xp.dump.RepoLoadResult;
import com.enonic.xp.dump.SystemDumpListener;
import com.enonic.xp.dump.SystemDumpParams;
import com.enonic.xp.dump.SystemDumpResult;
import com.enonic.xp.dump.SystemDumpUpgradeParams;
import com.enonic.xp.dump.SystemLoadListener;
import com.enonic.xp.dump.SystemLoadParams;
import com.enonic.xp.dump.SystemLoadResult;
import com.enonic.xp.export.ExportService;
import com.enonic.xp.export.ImportNodesParams;
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
import com.enonic.xp.upgrade.UpgradeListener;
import com.enonic.xp.vfs.VirtualFiles;

public class RcdDumpScriptBean
    extends RcdDataScriptBean
{
    private Supplier<ExportService> exportServiceSupplier;

    private Supplier<DumpService> dumpServiceSupplier;

    private Supplier<RepositoryService> repositoryServiceSupplier;

    private Supplier<NodeRepositoryService> nodeRepositoryServiceSupplier;

    private static final Path DUMP_ARCHIVE_DIRECTORY_PATH;

    static
    {
        try
        {
            DUMP_ARCHIVE_DIRECTORY_PATH = Files.createTempDirectory( "dump-archives-" );
            LOGGER.debug( "Created dump archive directory:" + DUMP_ARCHIVE_DIRECTORY_PATH.toAbsolutePath() );
        }
        catch ( IOException e )
        {
            throw new RcdException( "Error while creating dump archive directory", e );
        }
    }

    @Override
    public void initialize( final BeanContext context )
    {
        exportServiceSupplier = context.getService( ExportService.class );
        dumpServiceSupplier = context.getService( DumpService.class );
        repositoryServiceSupplier = context.getService( RepositoryService.class );
        nodeRepositoryServiceSupplier = context.getService( NodeRepositoryService.class );
    }

    public String list()
    {
        return runSafely( () -> {
            final RcdJsonArray dumpsJsonArray = RcdJsonService.createJsonArray();

            final Path dumpDirectoryPath = getDirectoryPath();
            if ( dumpDirectoryPath.toFile().exists() )
            {
                RcdFileService.listSubPaths( dumpDirectoryPath, dumpPath -> {
                    if ( dumpPath.toFile().isDirectory() )
                    {
                        final DumpInfo dumpInfo = getDumpInfo( dumpPath );
                        final String dumpType = getDumpType( dumpPath );
                        final RcdJsonObject dump = RcdJsonService.createJsonObject().
                            put( "name", dumpPath.getFileName().toString() ).
                            put( "timestamp", dumpPath.toFile().lastModified() ).
                            put( "type", dumpType ).
                            put( "xpVersion", dumpInfo.getXpVersion() ).
                            put( "modelVersion", dumpInfo.getModelVersion() ).
                            put( "canLoad", "versioned".equals( dumpType ) && "8".equals( dumpInfo.getModelVersion() ) );
                        dumpsJsonArray.add( dump );
                    }
                } );
            }
            return createSuccessResult( dumpsJsonArray );
        }, "Error while listing dumps" );
    }

    private String getDumpType( final Path dumpPath )
    {
        try
        {
            if ( isExportDump( dumpPath ) )
            {
                return "export";
            }
            else if ( isVersionedDump( dumpPath ) )
            {
                return "versioned";
            }
        }
        catch ( Exception e )
        {
            LOGGER.error( "Error while reading dump type", e );
        }
        return "";
    }

    private DumpInfo getDumpInfo( final Path dumpPath )
    {
        String xpVersion = null;
        String modelVersion = null;
        try
        {
            if ( isExportDump( dumpPath ) )
            {
                RcdPropertiesService.read( dumpPath.resolve( "export.properties" ) ).
                    get( "xp.version" );
            }
            else if ( isVersionedDump( dumpPath ) )
            {
                final StringBuilder dumpJsonContent = new StringBuilder();
                RcdTextFileService.read( RcdReadTextFileParams.newBuilder().
                    path( dumpPath.resolve( "dump.json" ) ).
                    contentConsumer( dumpJsonContent::append ).
                    build() );
                final JSObject dumpJson = (JSObject) RcdJavascriptService.eval( "JSON.parse('" + dumpJsonContent.toString() + "')" );
                xpVersion = (String) dumpJson.getMember( "xpVersion" );
                if ( dumpJson.hasMember( "modelVersion" ) )
                {
                    modelVersion = (String) dumpJson.getMember( "modelVersion" );
                }
                else
                {
                    if ( xpVersion != null && xpVersion.startsWith( "6." ) )
                    {
                        modelVersion = "0";
                    }
                }
            }
        }
        catch ( Exception e )
        {
            LOGGER.error( "Error while reading dump version", e );
        }
        return DumpInfo.create().
            xpVersion( xpVersion ).
            modelVersion( modelVersion ).
            build();
    }

    public String create( final String dumpName, final boolean includeVersion, final Integer maxVersions, final Integer maxVersionsAge )
    {
        return runSafely( () -> {
            final SystemDumpParams params = SystemDumpParams.create().
                dumpName( dumpName ).
                includeBinaries( true ).
                includeVersions( includeVersion ).
                maxAge( maxVersionsAge ).
                maxVersions( maxVersions ).
                listener( createSystemDumpListener() ).
                build();

            final SystemDumpResult systemDumpResult = dumpServiceSupplier.get().dump( params );
            final RcdJsonValue result = convertSystemDumpResultToJson( systemDumpResult );
            return createSuccessResult( result );
        }, "Error while creating dump" );
    }

    private SystemDumpListener createSystemDumpListener()
    {
        return new SystemDumpListener()
        {
            private String action = "Creating dump";

            private String repository = "";

            private int currentProgress = 0;

            private int totalProgress = 0;

            private long lastProgressReport = System.currentTimeMillis();

            @Override
            public void totalBranches( final long total )
            {
            }

            @Override
            public void dumpingBranch( final RepositoryId repositoryId, final Branch branch, final long total )
            {
                repository = repositoryId.toString();
                action = "Repository: " + repository + "<br/>" + "Branch: " + branch.toString() + "</br>" + "Dumping nodes";
                currentProgress = 0;
                totalProgress = (int) total;
                reportProgress( action, currentProgress, totalProgress );
            }

            @Override
            public void nodeDumped()
            {
                currentProgress++;
                if ( currentProgress == totalProgress )
                {
                    action = "Repository: " + repository + "<br/>" + "Dumping versions";
                    currentProgress = 0;
                    totalProgress = 0;
                }
                else if ( System.currentTimeMillis() - lastProgressReport > 200 )
                {
                    lastProgressReport = System.currentTimeMillis();
                    reportProgress( action, currentProgress, totalProgress );
                }
            }
        };
    }


    private SystemLoadListener createSystemLoadListener()
    {
        return new SystemLoadListener()
        {
            private String action = "Loading dump";

            private String repository = "";

            private int currentProgress = 0;

            private int totalProgress = 0;

            private long lastProgressReport = System.currentTimeMillis();

            @Override
            public void totalBranches( final long total )
            {
            }

            @Override
            public void loadingBranch( final RepositoryId repositoryId, final Branch branch, final Long total )
            {
                repository = repositoryId.toString();
                action = "Repository: " + repository + "<br/>" + "Branch: " + branch.toString() + "</br>" + "Loading nodes";
                currentProgress = 0;
                totalProgress = total.intValue();
                reportProgress( action, currentProgress, totalProgress );
            }

            @Override
            public void loadingVersions( final RepositoryId repositoryId )
            {
                action = "Repository: " + repositoryId.toString() + "<br/>" + "Loading versions";
                currentProgress = 0;
                totalProgress = 0;
                reportProgress( action, currentProgress, totalProgress );
            }

            @Override
            public void loadingCommits( final RepositoryId repositoryId )
            {
                action = "Repository: " + repositoryId.toString() + "<br/>" + "Loading commits";
                currentProgress = 0;
                totalProgress = 0;
                reportProgress( action, currentProgress, totalProgress );
            }

            @Override
            public void entryLoaded()
            {
                currentProgress++;
                if ( System.currentTimeMillis() - lastProgressReport > 200 )
                {
                    lastProgressReport = System.currentTimeMillis();
                    reportProgress( action, currentProgress, totalProgress );
                }
            }
        };
    }

    private UpgradeListener createUpgraderListener()
    {
        return new UpgradeListener()
        {
            private String action = "Upgrading dump";

            private int currentProgress = 0;

            private int totalProgress = 0;

            @Override
            public void total( final long total )
            {
                currentProgress = 0;
                totalProgress = (int) total;
                reportProgress( action, currentProgress, totalProgress );
            }

            @Override
            public void upgraded()
            {
                currentProgress++;
                reportProgress( action, currentProgress, totalProgress );
            }

            @Override
            public void finished()
            {

            }
        };
    }

    private RcdJsonValue convertSystemDumpResultToJson( final SystemDumpResult systemDumpResult )
    {
        final RcdJsonObject result = RcdJsonService.createJsonObject();
        for ( RepoDumpResult repoDumpResult : systemDumpResult )
        {
            result.put( repoDumpResult.getRepositoryId().toString(), convertRepoDumpResultToJson( repoDumpResult ) );
        }
        return result;
    }

    private RcdJsonValue convertRepoDumpResultToJson( final RepoDumpResult repoDumpResult )
    {
        final RcdJsonObject result = RcdJsonService.createJsonObject();
        for ( BranchDumpResult branchDumpResult : repoDumpResult )
        {
            result.put( branchDumpResult.getBranch().toString(), convertBranchDumpResultToJson( branchDumpResult ) );
        }
        return result;
    }

    private RcdJsonValue convertBranchDumpResultToJson( final BranchDumpResult branchDumpResult )
    {
        final RcdJsonObject result = RcdJsonService.createJsonObject();
        result.put( "successful", branchDumpResult.getSuccessful() );
        result.put( "errorCount", branchDumpResult.getErrors().size() );
        if ( !branchDumpResult.getErrors().isEmpty() )
        {
            final RcdJsonArray errors = result.createArray( "errors" );
            limitedAddAll( branchDumpResult.getErrors().stream(), errors, error -> ( (DumpError) error ).getMessage() );
        }
        return result;
    }

    public String load( final String dumpName )
    {
        return runSafelyNoDependency( () -> {
            if ( isExportDump( dumpName ) )
            {
                final RcdJsonObject result = RcdJsonService.createJsonObject();
                loadUsingExportService( dumpName, result );
                return RcdJsonService.toString( createSuccessResult( result ) );
            }
            else
            {
                final SystemLoadResult systemLoadResult = loadUsingSystemDumpService( dumpName );
                return convertSystemLoadResultToJson( systemLoadResult );
            }
        }, "Error while loading dump" );
    }

    public String upgrade( final String dumpName )
    {
        return runSafely( () -> {
            final SystemDumpUpgradeParams params = SystemDumpUpgradeParams.create().
                dumpName( dumpName ).
                upgradeListener( createUpgraderListener() ).
                build();
            final DumpUpgradeResult upgradeResult = dumpServiceSupplier.get().
                upgrade( params );
            final RcdJsonValue result = convertSystemUpgradeResultToJson( upgradeResult );
            return createSuccessResult( result );
        }, "Error while upgrading dump" );
    }

    private RcdJsonValue convertSystemUpgradeResultToJson( final DumpUpgradeResult upgradeResult )
    {
        final RcdJsonObject result = RcdJsonService.createJsonObject();
        result.put( "initialVersion", upgradeResult.getInitialVersion().toString() );
        result.put( "upgradedVersion", upgradeResult.getUpgradedVersion().toString() );
        return result;
    }

    private boolean isExportDump( final String dumpName )
    {
        final Path dumpPath = getDirectoryPath().
            resolve( dumpName );
        return isExportDump( dumpPath );
    }

    private boolean isExportDump( final Path dumpPath )
    {
        return dumpPath.
            resolve( "export.properties" ).
            toFile().
            exists();
    }

    private boolean isVersionedDump( final Path dumpPath )
    {
        return dumpPath.
            resolve( "dump.json" ).
            toFile().
            exists();
    }

    private void loadUsingExportService( final String dumpName, final RcdJsonObject result )
    {
        final NodeImportResult systemRepoImportResult = importSystemRepo( dumpName );
        result.createObject( "system" ).
            put( "master", convertNodeImportResultToJson( systemRepoImportResult ) );

        this.repositoryServiceSupplier.get().invalidateAll();
        for ( Repository repository : this.repositoryServiceSupplier.get().list() )
        {
            initializeRepo( repository );
            RcdJsonObject repositoryResult = SystemConstants.SYSTEM_REPO.equals( repository )
                ? (RcdJsonObject) result.get( "system" )
                : result.createObject( repository.getId().toString() );
            importRepoBranches( repository, dumpName, repositoryResult );
        }
    }

    private SystemLoadResult loadUsingSystemDumpService( final String dumpName )
    {
        final SystemLoadParams systemLoadParams = SystemLoadParams.create().
            dumpName( dumpName ).
            includeVersions( true ).
            listener( createSystemLoadListener() ).
            build();
        return dumpServiceSupplier.get().load( systemLoadParams );
    }

    private void initializeRepo( final Repository repository )
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

    private NodeImportResult importSystemRepo( final String dumpName )
    {
        return importRepoBranch( SystemConstants.SYSTEM_REPO.getId(), SystemConstants.BRANCH_SYSTEM, dumpName );
    }

    private void importRepoBranches( final Repository repository, final String dumpName, final RcdJsonObject result )
    {
        for ( Branch branch : repository.getBranches() )
        {
            if ( !isSystemRepoMaster( repository, branch ) )
            {
                final NodeImportResult nodeImportResult = importRepoBranch( repository.getId(), branch, dumpName );
                result.put( branch.getValue(), convertNodeImportResultToJson( nodeImportResult ) );
            }
        }
    }

    private boolean isSystemRepoMaster( final Repository repository, final Branch branch )
    {
        return SystemConstants.SYSTEM_REPO.equals( repository ) && SystemConstants.BRANCH_SYSTEM.equals( branch );
    }

    private NodeImportResult importRepoBranch( final RepositoryId repositoryId, final Branch branch, final String dumpName )
    {
        final Path sourcePath = getDirectoryPath().
            resolve( dumpName ).
            resolve( repositoryId.toString() ).
            resolve( branch.getValue() );
        final ImportNodesParams importNodesParams = ImportNodesParams.create().
            source( VirtualFiles.from( sourcePath ) ).
            targetNodePath( NodePath.ROOT ).
            dryRun( false ).
            includeNodeIds( true ).
            includePermissions( true ).
            build();
        return createContext( repositoryId, branch ).callWith( () -> exportServiceSupplier.get().importNodes( importNodesParams ) );
    }

    private String convertSystemLoadResultToJson( final SystemLoadResult systemLoadResult )
    {
        final StringBuilder result = new StringBuilder( "{\"success\":{" );
        final Iterator<RepoLoadResult> repoLoadResultIterator = systemLoadResult.iterator();
        while ( repoLoadResultIterator.hasNext() )
        {
            final RepoLoadResult repoLoadResult = repoLoadResultIterator.next();
            result.append( "\"" ).
                append( repoLoadResult.getRepositoryId().toString() ).
                append( "\":{" );
            convertRepoLoadResultToJson( repoLoadResult, result );
            result.append( "}" );
            if ( repoLoadResultIterator.hasNext() )
            {
                result.append( "," );
            }
        }
        result.append( "}}" );
        return result.toString();
    }

    private void convertRepoLoadResultToJson( final RepoLoadResult repoLoadResult, final StringBuilder result )
    {
        final Iterator<BranchLoadResult> repoLoadResultIterator = repoLoadResult.iterator();
        while ( repoLoadResultIterator.hasNext() )
        {
            final BranchLoadResult branchLoadResult = repoLoadResultIterator.next();
            result.append( "\"" ).
                append( branchLoadResult.getBranch().toString() ).
                append( "\":{" );
            convertBranchLoadResultToJson( branchLoadResult, result );
            result.append( "}" );
            if ( repoLoadResultIterator.hasNext() )
            {
                result.append( "," );
            }
        }
    }

    private void convertBranchLoadResultToJson( final BranchLoadResult branchLoadResult, final StringBuilder result )
    {
        final List<LoadError> errors = branchLoadResult.getErrors();

        result.append( "\"successful\":" ).
            append( branchLoadResult.getSuccessful() ).
            append( ",\"errorCount\":" ).
            append( errors.size() );
        if ( !errors.isEmpty() )
        {
            result.append( ",\"errors\":[" );
            for ( int i = 0; i < errors.size() && i < RESULT_DETAILS_COUNT; i++ )
            {
                result.append( "\"" + errors.get( i ).getError() + "\"" );
                if ( i < errors.size() - 1 )
                {
                    result.append( "," );
                }
            }
            if ( errors.size() > RESULT_DETAILS_COUNT )
            {
                result.append( "\"...\"" );
            }
            result.append( "]" );
        }
    }

    public String delete( final String... dumpNames )
    {
        return runSafely( () -> {
            for ( int i = 0; i < dumpNames.length; i++ )
            {
                final String dumpName = dumpNames[i];
                reportProgress( "Deleting dumps", i, dumpNames.length );
                final Path dumpPath = getDirectoryPath().resolve( dumpName );
                RcdFileService.delete( dumpPath );
            }
            return createSuccessResult();
        }, "Error while deleting dumps" );
    }

    @Override
    protected Path getArchiveDirectoryPath()
    {
        return DUMP_ARCHIVE_DIRECTORY_PATH;
    }

    @Override
    protected Path getDirectoryPath()
    {
        return HomeDir.get().
            toFile().
            toPath().
            resolve( "data/dump" );
    }

    @Override
    protected String getType()
    {
        return "dump";
    }
}
