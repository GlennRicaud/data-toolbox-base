package systems.rcd.enonic.datatoolbox;

import java.util.function.Supplier;

import org.elasticsearch.node.Node;

import systems.rcd.fwk.core.format.json.data.RcdJsonObject;

import com.enonic.xp.script.bean.BeanContext;

public class RcdIndexDocumentScriptBean
    extends RcdScriptBean
{
    private Supplier<Node> nodeSupplier;

    @Override
    public void initialize( final BeanContext context )
    {
        nodeSupplier = context.getService( Node.class );
    }

    public String get( final String repositoryName, final String branchName, final String type, final String id, final String versionKey )
    {
        return runSafely( () -> {

            final RcdJsonObject result = RcdIndexDocumentCommand.create().
                node( nodeSupplier.get() ).
                repositoryName( repositoryName ).
                branchName( branchName ).
                type( type ).
                id( id ).
                versionKey( versionKey ).
                build().
                get();
            
            return createSuccessResult( result );
        }, "Error while retrieving index document" );
    }
}
