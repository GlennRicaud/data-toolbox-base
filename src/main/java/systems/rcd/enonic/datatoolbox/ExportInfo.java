package systems.rcd.enonic.datatoolbox;

public class ExportInfo
{
    private final String xpVersion;

    private final long size;

    private ExportInfo(final Builder builder )
    {
        xpVersion = builder.xpVersion == null ? "" : builder.xpVersion;
        size = builder.size;
    }

    public String getXpVersion()
    {
        return xpVersion;
    }

    public long getSize()
    {
        return size;
    }

    public static ExportInfo from(final String xpVersion )
    {
        return ExportInfo.create().
            xpVersion( xpVersion ).
            build();
    }

    public static Builder create()
    {
        return new Builder();
    }

    public static final class Builder
    {
        private String xpVersion;

        private long size = -1;

        private Builder()
        {
        }

        public Builder xpVersion( final String xpVersion )
        {
            this.xpVersion = xpVersion;
            return this;
        }

        public Builder size( final long size )
        {
            this.size = size;
            return this;
        }

        public ExportInfo build()
        {
            return new ExportInfo( this );
        }
    }
}
