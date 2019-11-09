package systems.rcd.enonic.datatoolbox;

public class DumpInfo
{
    private final String xpVersion;

    private final String modelVersion;

    private DumpInfo( final Builder builder )
    {
        xpVersion = builder.xpVersion == null ? "" : builder.xpVersion;
        modelVersion = builder.modelVersion == null ? "" : builder.modelVersion;
    }

    public String getXpVersion()
    {
        return xpVersion;
    }

    public String getModelVersion()
    {
        return modelVersion;
    }

    public static DumpInfo from( final String xpVersion )
    {
        return DumpInfo.create().
            xpVersion( xpVersion ).
            build();
    }

    public static DumpInfo from( final String xpVersion, final String modelVersion )
    {
        return DumpInfo.create().
            xpVersion( xpVersion ).
            modelVersion( modelVersion ).
            build();
    }

    public static Builder create()
    {
        return new Builder();
    }

    public static final class Builder
    {
        private String xpVersion;

        private String modelVersion;

        private Builder()
        {
        }

        public Builder xpVersion( final String xpVersion )
        {
            this.xpVersion = xpVersion;
            return this;
        }

        public Builder modelVersion( final String modelVersion )
        {
            this.modelVersion = modelVersion;
            return this;
        }

        public DumpInfo build()
        {
            return new DumpInfo( this );
        }
    }
}
