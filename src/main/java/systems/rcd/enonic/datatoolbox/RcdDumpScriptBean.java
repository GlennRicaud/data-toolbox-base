package systems.rcd.enonic.datatoolbox;

import com.enonic.xp.branch.Branch;
import com.enonic.xp.dump.*;
import com.enonic.xp.home.HomeDir;
import com.enonic.xp.repository.RepositoryId;
import com.enonic.xp.repository.RepositoryIds;
import com.enonic.xp.script.bean.BeanContext;
import com.enonic.xp.upgrade.UpgradeListener;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectReader;
import systems.rcd.fwk.core.exc.RcdException;
import systems.rcd.fwk.core.format.json.RcdJsonService;
import systems.rcd.fwk.core.format.json.data.RcdJsonArray;
import systems.rcd.fwk.core.format.json.data.RcdJsonObject;
import systems.rcd.fwk.core.format.json.data.RcdJsonValue;
import systems.rcd.fwk.core.io.file.RcdFileService;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Collections;
import java.util.Enumeration;
import java.util.Iterator;
import java.util.List;
import java.util.function.Supplier;
import java.util.regex.Pattern;
import java.util.zip.ZipEntry;
import java.util.zip.ZipFile;

public class RcdDumpScriptBean
    extends RcdDataScriptBean
{

    public static final Pattern DUMP_JSON_ENTRY_NAME_PATTERN = Pattern.compile( "^[^/]+/dump.json$" );

    private Supplier<DumpService> dumpServiceSupplier;

    private ObjectReader objectReader = new ObjectMapper().reader();

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
        dumpServiceSupplier = context.getService( DumpService.class );
    }

    public String list()
    {
        return runSafely( () -> {
            final RcdJsonArray dumpsJsonArray = RcdJsonService.createJsonArray();
            final Path dumpDirectoryPath = getDirectoryPath();
            if ( dumpDirectoryPath.toFile().exists() )
            {
                RcdFileService.listSubPaths( dumpDirectoryPath, dumpPath -> {
                    final File dumpFile = dumpPath.toFile();
                    final boolean isArchived = isArchived( dumpFile );
                    if ( isArchived )
                    {
                        final DumpInfo dumpInfo = getDumpInfo( dumpPath );
                        final String dumpType = getDumpType( dumpPath );
                        final RcdJsonObject dump = RcdJsonService.createJsonObject().
                            put( "name", dumpPath.getFileName().toString() ).
                            put( "timestamp", dumpFile.lastModified() ).
                            put( "type", dumpType ).
                            put( "xpVersion", dumpInfo.getXpVersion() ).
                            put( "modelVersion", dumpInfo.getModelVersion() ).
                            put( "size", dumpInfo.getSize() ).
                            put( "canLoad", canLoad( dumpInfo, dumpType ) );
                        dumpsJsonArray.add( dump );
                    }
                } );
            }
            return createSuccessResult( dumpsJsonArray );
        }, "Error while listing dumps" );
    }

    private boolean canLoad( final DumpInfo dumpInfo, final String dumpType )
    {
        return ( "versioned".equals( dumpType ) || "archived".equals( dumpType ) ) && "8".equals( dumpInfo.getModelVersion() );
    }

    private String getDumpType( final Path dumpPath )
    {
        try
        {
            if ( isArchived( dumpPath ) )
            {
                return "archived";
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
        long size = -1;
        try
        {
            if ( isArchived( dumpPath ) )
            {
                final File dumpFile = dumpPath.toFile();
                size = dumpFile.length();
                final ZipFile archiveZipFile = new ZipFile( dumpFile );
                ZipEntry dumpJsonZipEntry = archiveZipFile.getEntry( "/dump.json" );
                if ( dumpJsonZipEntry == null )
                {
                    final String dumpArchiveFileName = dumpPath.getFileName().toString();
                    dumpJsonZipEntry =
                        archiveZipFile.getEntry( dumpArchiveFileName.substring( 0, dumpArchiveFileName.length() - 4 ) + "/dump.json" );
                }
                if ( dumpJsonZipEntry == null )
                {
                    final Enumeration<? extends ZipEntry> entries = archiveZipFile.entries();
                    while ( entries.hasMoreElements() )
                    {
                        final ZipEntry zipEntry = entries.nextElement();
                        if ( DUMP_JSON_ENTRY_NAME_PATTERN.matcher( zipEntry.getName() ).matches() )
                        {
                            dumpJsonZipEntry = zipEntry;
                            break;
                        }
                    }
                }
                if ( dumpJsonZipEntry != null )
                {
                    final InputStream dumpJsonInputStream = archiveZipFile.getInputStream( dumpJsonZipEntry );
                    final BufferedInputStream dumpJsonBufferedInputStream = new BufferedInputStream( dumpJsonInputStream );

                    try (dumpJsonBufferedInputStream)
                    {
                        final byte[] bytes = dumpJsonBufferedInputStream.readAllBytes();
                        final String dumpJsonContent = new String( bytes );
                        final JsonNode dumpJson = objectReader.readTree( dumpJsonContent );
                        xpVersion = dumpJson.get( "xpVersion" ).asText();
                        modelVersion = getModelVersion( dumpJson, xpVersion );
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
            size( size ).
            build();
    }

    private String getModelVersion( final JsonNode dumpJson, final String xpVersion )
    {
        if ( dumpJson.has( "modelVersion" ) )
        {
            return dumpJson.get( "modelVersion" ).asText();
        }
        if ( xpVersion != null && xpVersion.startsWith( "6." ) )
        {
            return "0";
        }
        return null;
    }

    public String create( final String dumpName, final boolean includeVersion, final Integer maxVersions,
                          final Integer maxVersionsAge, final String repositoryId )
    {
        return runSafely( () -> {
            final SystemDumpParams.Builder params = SystemDumpParams.create().
                dumpName( dumpName ).
                includeBinaries( true ).
                includeVersions( includeVersion ).
                maxAge( maxVersionsAge ).
                maxVersions( maxVersions ).
                listener( createSystemDumpListener() );
            if (repositoryId != null) {
                params.repositories( RepositoryIds.from(Collections.singleton(repositoryId) ) );
            }

            final SystemDumpResult systemDumpResult = dumpServiceSupplier.get().dump( params.build() );
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
                action = "Repository: " + repository + "\n" + "Branch: " + branch.toString() + "\n" + "Dumping nodes";
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
                    action = "Repository: " + repository + "\n" + "Dumping versions";
                    currentProgress = 0;
                    totalProgress = 0;
                    reportProgress( action, currentProgress, totalProgress );
                }
                else if ( ( System.currentTimeMillis() - lastProgressReport ) > 200 )
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
                action = "Repository: " + repository + "\n" + "Branch: " + branch.toString() + "\n" + "Loading nodes";
                currentProgress = 0;
                totalProgress = total.intValue();
                reportProgress( action, currentProgress, totalProgress );
            }

            @Override
            public void loadingVersions( final RepositoryId repositoryId )
            {
                action = "Repository: " + repositoryId.toString() + "\n" + "Loading versions";
                currentProgress = 0;
                totalProgress = 0;
                reportProgress( action, currentProgress, totalProgress );
            }

            @Override
            public void loadingCommits( final RepositoryId repositoryId )
            {
                action = "Repository: " + repositoryId.toString() + "\n" + "Loading commits";
                currentProgress = 0;
                totalProgress = 0;
                reportProgress( action, currentProgress, totalProgress );
            }

            @Override
            public void entryLoaded()
            {
                currentProgress++;
                if ( currentProgress == totalProgress || ( System.currentTimeMillis() - lastProgressReport ) > 200 )
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
            final SystemLoadResult systemLoadResult = loadUsingSystemDumpService( dumpName );
            return convertSystemLoadResultToJson( systemLoadResult );
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



    private SystemLoadResult loadUsingSystemDumpService( final String dumpName )
    {
        final Path dumpPath = getDirectoryPath().resolve( dumpName );
        final boolean archivedDump = isArchived( dumpPath ); //Should always be true starting from XP 8.0
        final String dumpNameRoot = archivedDump ? dumpName.substring( 0, dumpName.length() - ".zip".length() ) : dumpName;

        final SystemLoadParams systemLoadParams = SystemLoadParams.create().
            dumpName( dumpNameRoot ).
            includeVersions( true ).
            listener( createSystemLoadListener() ).
            build();
        return dumpServiceSupplier.get().load( systemLoadParams );
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
