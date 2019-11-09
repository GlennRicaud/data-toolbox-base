package systems.rcd.enonic.datatoolbox;

import java.util.Arrays;
import java.util.function.Supplier;

import systems.rcd.fwk.core.format.json.RcdJsonService;
import systems.rcd.fwk.core.format.json.data.RcdJsonArray;
import systems.rcd.fwk.core.format.json.data.RcdJsonObject;

import com.enonic.xp.node.DeleteSnapshotParams;
import com.enonic.xp.node.RestoreParams;
import com.enonic.xp.node.SnapshotParams;
import com.enonic.xp.node.SnapshotResult;
import com.enonic.xp.script.bean.BeanContext;
import com.enonic.xp.snapshot.SnapshotService;

public class RcdSnapshotScriptBean
    extends RcdScriptBean
{
    private Supplier<SnapshotService> snapshotServiceSupplier;

    @Override
    public void initialize( final BeanContext context )
    {
        snapshotServiceSupplier = context.getService( SnapshotService.class );
    }

    public String list()
    {
        return runSafely( () -> {
            final RcdJsonArray snapshotJsonArray = RcdJsonService.createJsonArray();

            for ( SnapshotResult snapshotResult : snapshotServiceSupplier.get().list() )
            {
                final RcdJsonObject snapshot = RcdJsonService.createJsonObject().
                    put( "name", snapshotResult.getName() ).
                    put( "timestamp", snapshotResult.getTimestamp().toEpochMilli() );
                snapshotJsonArray.add( snapshot );
            }
            return createSuccessResult( snapshotJsonArray );
        }, "Error while listing snapshots" );
    }

    public String create( String snapshotName )
    {
        return runSafely( () -> {

            final SnapshotParams snapshotParams = SnapshotParams.create().
                snapshotName( snapshotName.toLowerCase() ).
                build();

            snapshotServiceSupplier.get().
                snapshot( snapshotParams );

            return createSuccessResult();
        }, "Error while creating snapshot" );
    }

    public String delete( final String... snapshotNames )
    {
        return runSafely( () -> {
            final DeleteSnapshotParams deleteSnapshotParams = DeleteSnapshotParams.create().
                addAll( Arrays.asList( snapshotNames ) ).
                build();

            snapshotServiceSupplier.get().
                delete( deleteSnapshotParams );

            return createSuccessResult();
        }, "Error while deleting snapshots" );
    }

    public String load( String snapshotName )
    {
        return runSafely( () -> {

            final RestoreParams restoreParams = RestoreParams.create().
                snapshotName( snapshotName ).
                build();
            snapshotServiceSupplier.get().
                restore( restoreParams );
            //TODO
            //Node storage invalidation
            //Node event publishing
            //Node event publishing
            return createSuccessResult();
        }, "Error while loading snapshot" );
    }
}
