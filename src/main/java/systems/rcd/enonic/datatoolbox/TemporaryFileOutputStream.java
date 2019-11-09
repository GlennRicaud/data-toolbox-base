package systems.rcd.enonic.datatoolbox;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;

public class TemporaryFileOutputStream
    extends FileOutputStream
{

    private final File file;

    public TemporaryFileOutputStream( File file )
        throws FileNotFoundException
    {
        super( file );
        this.file = file;
    }

    @Override
    public void close()
        throws IOException
    {
        super.close();
        file.delete();
    }
}