package systems.rcd.enonic.datatoolbox;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;

public class TemporaryFileInputStream
    extends FileInputStream
{

    private final File file;

    public TemporaryFileInputStream( File file )
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