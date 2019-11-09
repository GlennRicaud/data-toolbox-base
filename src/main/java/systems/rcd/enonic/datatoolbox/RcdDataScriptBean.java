package systems.rcd.enonic.datatoolbox;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.function.Predicate;
import java.util.zip.ZipEntry;

import com.google.common.io.ByteSource;

import systems.rcd.fwk.core.exc.RcdException;
import systems.rcd.fwk.core.format.json.RcdJsonService;
import systems.rcd.fwk.core.format.json.data.RcdJsonString;
import systems.rcd.fwk.core.util.zip.RcdZipService;

public abstract class RcdDataScriptBean
    extends RcdScriptBean
{
    public String archive( final String... names )
    {
        return runSafely( () -> {
            final java.nio.file.Path[] paths = Arrays.stream( names ).
                map( name -> getDirectoryPath().resolve( name ) ).
                toArray( size -> new java.nio.file.Path[size] );
            final String archiveName = ( names.length == 1 ? names[0] : getType() + "-archive" ) + "-";
            final Path archivePath;
            try
            {
                archivePath = Files.createTempFile( getArchiveDirectoryPath(), archiveName, ".zip" );
            }
            catch ( IOException e )
            {
                throw new RcdException( "Error while creating archive file", e );
            }
            archivePath.toFile().deleteOnExit();

            LOGGER.debug( "Archiving folders " + Arrays.toString( names ) + " into [" + archivePath.toAbsolutePath() + "]..." );
            RcdZipService.zip( archivePath, paths );
            LOGGER.debug( "Folders " + Arrays.toString( names ) + " archived" );

            final RcdJsonString result = RcdJsonService.createJsonValue( archivePath.getFileName().toString() );
            return createSuccessResult( result );
        }, "Error while archiving " + getType() + "s" );
    }

    public TemporaryFileByteSource download( final String archiveName )
        throws IOException
    {
        final File archiveFile = new File( getArchiveDirectoryPath().toFile(), archiveName );
        return new TemporaryFileByteSource( archiveFile );
    }
    
    public String upload( String filename, ByteSource archiveByteSource )
        throws IOException
    {
        final java.nio.file.Path archivePath = Files.createTempFile( getArchiveDirectoryPath(), filename, ".tmp" );
        final File archiveFile = archivePath.toFile();
        archiveFile.deleteOnExit();
        try (FileOutputStream tmp = new FileOutputStream( archiveFile ))
        {
            archiveByteSource.copyTo( tmp );
        }
        return archivePath.getFileName().toString();
    }

    public String unarchive( final String archiveName )
        throws IOException
    {
        final File archiveFile = new File( getArchiveDirectoryPath().toFile(), archiveName );
        return runSafely( () -> {
            LOGGER.debug( "Unarchiving [" + archiveFile.getAbsolutePath() + "] into [" + getDirectoryPath() + "]..." );
            Predicate<ZipEntry> filter = zipEntry -> !zipEntry.getName().startsWith( "__MACOSX/" );
            RcdZipService.unzip( archiveFile.toPath(), getDirectoryPath(), filter );
            LOGGER.debug( getCamelType() + "s unarchived!" );
            return createSuccessResult();
        }, "Error while unarchiving " + getType() + "s", () -> {
            if ( archiveFile.exists() )
            {
                archiveFile.delete();
            }
        } );
    }

    protected abstract Path getArchiveDirectoryPath();

    protected abstract Path getDirectoryPath();

    protected abstract String getType();

    protected String getCamelType()
    {
        return Character.toUpperCase( getType().charAt( 0 ) ) + getType().substring( 1 );
    }
}
