package systems.rcd.enonic.datatoolbox;

import java.util.function.Supplier;

import org.elasticsearch.node.Node;

import com.google.common.base.Charsets;

import systems.rcd.fwk.core.format.json.RcdJsonService;
import systems.rcd.fwk.core.format.json.data.RcdJsonArray;
import systems.rcd.fwk.core.format.json.data.RcdJsonObject;

import com.enonic.xp.blob.BlobKey;
import com.enonic.xp.blob.BlobRecord;
import com.enonic.xp.blob.BlobStore;
import com.enonic.xp.blob.Segment;
import com.enonic.xp.blob.SegmentLevel;
import com.enonic.xp.repository.RepositoryId;
import com.enonic.xp.repository.RepositorySegmentUtils;
import com.enonic.xp.script.bean.BeanContext;

public class RcdBlobScriptBean
    extends RcdScriptBean
{
    private Supplier<Node> nodeSupplier;

    private Supplier<BlobStore> blobStoreSupplier;

    @Override
    public void initialize( final BeanContext context )
    {
        super.initialize( context );
        nodeSupplier = context.getService( Node.class );
        blobStoreSupplier = context.getService( BlobStore.class );
    }

    public String get( final String repositoryName, final String type, final String blobKeyString )
    {
        try
        {
            final RepositoryId repositoryId = RepositoryId.from( repositoryName );
            final SegmentLevel blobSegmentLevel = SegmentLevel.from( type );
            final BlobKey blobKey = BlobKey.from( blobKeyString );
            final Segment segment = RepositorySegmentUtils.toSegment( repositoryId, blobSegmentLevel );
            final BlobRecord blobRecord = blobStoreSupplier.get().
                getRecord( segment, blobKey );
            final String blobContent = blobRecord.getBytes().
                asCharSource( Charsets.UTF_8 ).
                read();
            return "{\"success\":" + blobContent + "}";
        }
        catch ( Exception e )
        {
            final String errorMessage = "Error while retrieving blob";
            LOGGER.error( errorMessage, e );
            return RcdJsonService.toString( createErrorResult( errorMessage ) );
        }
    }
}
