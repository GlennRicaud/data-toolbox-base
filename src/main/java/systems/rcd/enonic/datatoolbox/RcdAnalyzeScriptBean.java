package systems.rcd.enonic.datatoolbox;

import java.util.function.Supplier;

import org.elasticsearch.node.Node;

import systems.rcd.fwk.core.format.json.data.RcdJsonObject;

import com.enonic.xp.script.bean.BeanContext;

public class RcdAnalyzeScriptBean
    extends RcdScriptBean
{
    private Supplier<Node> nodeSupplier;

    @Override
    public void initialize( final BeanContext context )
    {
        nodeSupplier = context.getService( Node.class );
    }

    public String analyze( final String repositoryName, final String field, final String analyzer, final String text )
    {
        return runSafely( () -> {
            final RcdJsonObject result = RcdAnalyzeCommand.create().
                node( nodeSupplier.get() ).
                repositoryName( repositoryName ).
                field( field ).
                analyzer( analyzer ).
                text( text ).
                build().
                analyze();
            return createSuccessResult( result );
        }, "Error while analyzing" );
    }
}
