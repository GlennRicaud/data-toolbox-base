package systems.rcd.enonic.datatoolbox;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;

import com.google.common.io.ByteSource;

public class TemporaryFileByteSource
    extends ByteSource
{
    private File file;

    public TemporaryFileByteSource( File file )
    {
        this.file = file;
    }

    @Override
    public long size()
        throws IOException
    {
        if ( !file.isFile() )
        {
            throw new FileNotFoundException( file.toString() );
        }
        return file.length();
    }

    @Override
    public InputStream openStream()
        throws IOException
    {
        return new TemporaryFileInputStream( file );
    }
}
