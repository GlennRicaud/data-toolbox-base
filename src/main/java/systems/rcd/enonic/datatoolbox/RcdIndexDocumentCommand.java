package systems.rcd.enonic.datatoolbox;

import java.util.List;

import org.apache.commons.lang.StringEscapeUtils;
import org.elasticsearch.action.get.GetRequest;
import org.elasticsearch.action.get.GetResponse;
import org.elasticsearch.node.Node;

import systems.rcd.fwk.core.format.json.RcdJsonService;
import systems.rcd.fwk.core.format.json.data.RcdJsonArray;
import systems.rcd.fwk.core.format.json.data.RcdJsonObject;

public class RcdIndexDocumentCommand
{
    private Node node;

    private String repositoryName;

    private String branchName;

    private String type;

    private String id;

    private String versionKey;

    private RcdIndexDocumentCommand( final Builder builder )
    {
        node = builder.node;
        repositoryName = builder.repositoryName;
        branchName = builder.branchName;
        type = builder.type;
        id = builder.id;
        versionKey = builder.versionKey;
    }

    public RcdJsonObject get()
    {
        final String indexName = generateIndexName( type, repositoryName );
        final String indexTypeName = generateIndexTypeName( type, branchName );
        final String indexDocumentId = generateIndexDocumentId( type, id, branchName, versionKey );
        final GetRequest getRequest = new GetRequest( indexName, indexTypeName, indexDocumentId );
        if ( "branch".equals( type ) )
        {
            getRequest.parent( generateIndexDocumentId( "version", id, branchName, versionKey ) );
        }

        final GetResponse getResponse = node.client().
            get( getRequest ).
            actionGet( 4000 );

        if ( !getResponse.isExists() )
        {
            throw new RuntimeException( "Index document not found" );
        }

        final RcdJsonObject source = RcdJsonService.createJsonObject();
        getResponse.getSource().entrySet().forEach( sourceEntry -> {
            final Object fieldValues = sourceEntry.getValue();
            if ( fieldValues instanceof Iterable )
            {
                final RcdJsonArray field = source.createArray( sourceEntry.getKey() );
                ( (List) fieldValues ).forEach( fieldValue -> {
                    final String escapedValue = StringEscapeUtils.escapeHtml( fieldValue.toString() );
                    field.add( escapedValue );
                } );
            }
        } );

        return RcdJsonService.createJsonObject().
            put( "_index", getResponse.getIndex() ).
            put( "_type", getResponse.getType() ).
            put( "_id", getResponse.getId() ).
            put( "_version", getResponse.getVersion() ).
            put( "_source", source );
    }

    private String generateIndexName( final String type, final String repositoryName )
    {
        switch ( type )
        {
            case "search":
                return "search-" + repositoryName;
            case "branch":
            case "version":
                return "storage-" + repositoryName;
            default:
                return null;
        }
    }

    private String generateIndexTypeName( final String type, final String branchName )
    {
        switch ( type )
        {
            case "search":
                return branchName;
            case "branch":
            case "version":
                return type;
            default:
                return null;
        }
    }

    private String generateIndexDocumentId( final String type, final String id, final String branchName, final String versionKey )
    {
        switch ( type )
        {
            case "search":
                return id;
            case "branch":
                return id + "_" + branchName;
            case "version":
                return versionKey;
            default:
                return null;
        }
    }

    public static Builder create()
    {
        return new Builder();
    }

    public static final class Builder
    {
        private Node node;

        private String repositoryName;

        private String branchName;

        private String type;

        private String id;

        private String versionKey;

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

        public Builder branchName( final String branchName )
        {
            this.branchName = branchName;
            return this;
        }

        public Builder type( final String type )
        {
            this.type = type;
            return this;
        }

        public Builder id( final String id )
        {
            this.id = id;
            return this;
        }

        public Builder versionKey( final String versionKey )
        {
            this.versionKey = versionKey;
            return this;
        }

        public RcdIndexDocumentCommand build()
        {
            return new RcdIndexDocumentCommand( this );
        }
    }
}
