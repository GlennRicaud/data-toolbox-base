package systems.rcd.enonic.datatoolbox;

import java.io.BufferedOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.function.BiConsumer;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

import systems.rcd.fwk.core.exc.RcdException;
import systems.rcd.fwk.core.format.json.RcdJsonService;
import systems.rcd.fwk.core.format.json.data.RcdJsonString;

import com.enonic.xp.script.ScriptValue;

public class RcdReportScriptBean
    extends RcdScriptBean
{
    private static final Path REPORT_ARCHIVE_DIRECTORY_PATH;

    static
    {
        try
        {
            REPORT_ARCHIVE_DIRECTORY_PATH = Files.createTempDirectory( "report-archives-" );
            LOGGER.debug( "Created report archive directory:" + REPORT_ARCHIVE_DIRECTORY_PATH.toAbsolutePath() );
        }
        catch ( IOException e )
        {
            throw new RcdException( "Error while creating report archive directory", e );
        }
    }

    public String createReportFile( final String reportName, final ScriptValue entryGenerationFunction )
    {
        return runSafely( () -> {
            final Path archivePath = createTempFile( reportName );
            archivePath.toFile().deleteOnExit();

            LOGGER.debug( "Generating report into [" + archivePath.toAbsolutePath() + "]..." );
            generateEntries( archivePath, entryGenerationFunction );
            LOGGER.debug( "Report generated" );

            final RcdJsonString result = RcdJsonService.createJsonValue( archivePath.getFileName().toString() );
            return createSuccessResult( result );
        }, "Error while generating report" );
    }

    public TemporaryFileByteSource download( final String archiveName )
    {
        final File archiveFile = new File( REPORT_ARCHIVE_DIRECTORY_PATH.toFile(), archiveName );
        return new TemporaryFileByteSource( archiveFile );
    }

    private Path createTempFile( final String reportName )
    {
        try
        {
            return Files.createTempFile( REPORT_ARCHIVE_DIRECTORY_PATH, reportName + "-", ".zip" );
        }
        catch ( IOException e )
        {
            throw new RcdException( "Error while creating report file", e );
        }
    }

    private void generateEntries( final Path target, final ScriptValue entryGenerationFunction )
    {
        try (ZipOutputStream zipOutputStream = new ZipOutputStream( new BufferedOutputStream( new FileOutputStream( target.toFile() ) ) ))
        {
            final BiConsumer<String, String> createReportConsumer =
                ( String entryPath, String content ) -> generateEntry( entryPath, content, zipOutputStream );
            entryGenerationFunction.call( createReportConsumer );
        }
        catch ( Exception e )
        {
            throw new RcdException( "Error while generating report", e );
        }
    }

    private void generateEntry( final String entryPath, final String entryContent, final ZipOutputStream zipOutputStream )
    {
        try
        {
            final ZipEntry zipEntry = new ZipEntry( entryPath );
            zipOutputStream.putNextEntry( zipEntry );
            zipOutputStream.write( entryContent.getBytes() );
        }
        catch ( Exception e )
        {
            throw new RcdException( "Error while creating report entry", e );
        }
    }
}
