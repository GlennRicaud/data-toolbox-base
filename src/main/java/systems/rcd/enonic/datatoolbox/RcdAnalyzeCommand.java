package systems.rcd.enonic.datatoolbox;

import org.elasticsearch.action.admin.indices.analyze.AnalyzeRequest;
import org.elasticsearch.action.admin.indices.analyze.AnalyzeResponse;
import org.elasticsearch.node.Node;

import com.google.common.base.Strings;

import systems.rcd.fwk.core.format.json.RcdJsonService;
import systems.rcd.fwk.core.format.json.data.RcdJsonArray;
import systems.rcd.fwk.core.format.json.data.RcdJsonObject;

public class RcdAnalyzeCommand
{
    private Node node;

    private String repositoryName;

    private String field;

    private String analyzer;

    private String text;

    private RcdAnalyzeCommand( final Builder builder )
    {
        node = builder.node;
        repositoryName = builder.repositoryName;
        field = builder.field;
        analyzer = builder.analyzer;
        text = builder.text;
    }

    public RcdJsonObject analyze()
    {

        final AnalyzeRequest analyzeRequest = new AnalyzeRequest( "search-" + repositoryName ).
            analyzer( analyzer ).
            field( field ).
            text( this.text );

        final AnalyzeResponse response = node.client().
            admin().
            indices().
            analyze( analyzeRequest ).
            actionGet( 5_000 );

        final RcdJsonObject result = RcdJsonService.createJsonObject();
        final RcdJsonArray resultTokens = result.createArray( "tokens" );
        response.getTokens().
            stream().
            map( AnalyzeResponse.AnalyzeToken::getTerm ).
            forEach( resultTokens::add );

        return result;
    }

    public static Builder create()
    {
        return new Builder();
    }

    public static final class Builder
    {
        private Node node;

        private String repositoryName;

        private String field;

        private String analyzer;

        private String text;

        private Builder()
        {
        }

        public Builder node( final Node node )
        {
            this.node = node;
            return this;
        }

        public Builder repositoryName( final String repositoryName )
        {
            this.repositoryName = repositoryName;
            return this;
        }

        public Builder field( final String field )
        {
            this.field = Strings.emptyToNull( field );
            return this;
        }

        public Builder analyzer( final String analyzer )
        {
            this.analyzer = Strings.emptyToNull( analyzer );
            return this;
        }

        public Builder text( final String text )
        {
            this.text = text;
            return this;
        }

        public RcdAnalyzeCommand build()
        {
            return new RcdAnalyzeCommand( this );
        }
    }
}
