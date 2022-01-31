package systems.rcd.enonic.datatoolbox;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectWriter;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import systems.rcd.fwk.core.ctx.RcdContext;
import systems.rcd.fwk.core.format.json.RcdJsonService;
import systems.rcd.fwk.core.format.json.data.*;
import systems.rcd.fwk.core.format.json.impl.data.*;

import java.io.IOException;
import java.util.Iterator;

@Component(immediate = true)
public class JacksonJsonService implements RcdJsonService {

    private final ObjectWriter objectWriter;

    public JacksonJsonService() {
        this.objectWriter = new ObjectMapper().writer();
    }

    @Activate
    public void activate() {
        RcdContext.setGlobalServiceSupplier( RcdJsonService.class, () -> this );
    }

    public RcdJsonBoolean instCreateJsonValue(Boolean value) {
        return new RcdSimpleJsonBoolean(value);
    }

    public RcdJsonNumber instCreateJsonValue(Number value) {
        return new RcdSimpleJsonNumber(value);
    }

    public RcdJsonString instCreateJsonValue(String value) {
        return new RcdSimpleJsonString(value);
    }

    public RcdJsonArray instCreateJsonArray() {
        return new RcdSimpleJsonArray();
    }

    public RcdJsonObject instCreateJsonObject() {
        return new RcdSimpleJsonObject();
    }

    public void instToString( final RcdJsonValue value, final Appendable output )
            throws IOException
    {
        if ( value == null )
        {
            append(null, output);
            return;
        }

        switch ( value.getType() )
        {
            case BOOLEAN:
                append(( (RcdJsonBoolean) value ).getValue(), output);
                break;
            case NUMBER:
                append(( (RcdJsonNumber) value ).getValue(), output);
                break;
            case STRING:
                append(( (RcdJsonString) value ).getValue(), output);
                break;
            case OBJECT:
                final RcdJsonObject jsonObject = (RcdJsonObject) value;
                output.append( "{" );
                for ( final Iterator<String> iterator = jsonObject.getKeys().iterator(); iterator.hasNext(); )
                {
                    final String key = iterator.next();
                    output.append( "\"" ).append( key ).append( "\"" ).append( ":" );
                    instToString( jsonObject.get( key ), output );
                    if ( iterator.hasNext() )
                    {
                        output.append( ',' );
                    }
                }
                output.append( "}" );
                break;
            case ARRAY:
                final RcdJsonArray jsonArray = (RcdJsonArray) value;
                output.append( "[" );
                for ( final Iterator<RcdJsonValue> iterator = jsonArray.iterator(); iterator.hasNext(); )
                {
                    final RcdJsonValue jsonValue = iterator.next();
                    instToString( jsonValue, output );
                    if ( iterator.hasNext() )
                    {
                        output.append( "," );
                    }
                }
                output.append( "]" );
                break;
        }
    }

    private void append(Object value, Appendable appendable) throws IOException {
        appendable.append(objectWriter.writeValueAsString(value));
    }
}
