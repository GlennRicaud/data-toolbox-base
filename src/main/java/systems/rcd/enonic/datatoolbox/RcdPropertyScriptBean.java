package systems.rcd.enonic.datatoolbox;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.function.Supplier;

import org.apache.commons.lang.StringEscapeUtils;

import jdk.nashorn.api.scripting.ScriptObjectMirror;
import systems.rcd.fwk.core.exc.RcdException;
import systems.rcd.fwk.core.format.json.RcdJsonService;
import systems.rcd.fwk.core.format.json.data.RcdJsonArray;
import systems.rcd.fwk.core.format.json.data.RcdJsonObject;

import com.enonic.xp.branch.Branch;
import com.enonic.xp.context.Context;
import com.enonic.xp.context.ContextAccessor;
import com.enonic.xp.context.ContextBuilder;
import com.enonic.xp.data.Property;
import com.enonic.xp.data.PropertySet;
import com.enonic.xp.data.Value;
import com.enonic.xp.data.ValueFactory;
import com.enonic.xp.node.Node;
import com.enonic.xp.node.NodeEditor;
import com.enonic.xp.node.NodePath;
import com.enonic.xp.node.NodeService;
import com.enonic.xp.node.UpdateNodeParams;
import com.enonic.xp.repository.RepositoryId;
import com.enonic.xp.script.bean.BeanContext;
import com.enonic.xp.util.BinaryReference;
import com.enonic.xp.util.GeoPoint;
import com.enonic.xp.util.Link;
import com.enonic.xp.util.Reference;

public class RcdPropertyScriptBean
    extends RcdScriptBean
{
    private Supplier<NodeService> nodeServiceSupplier;

    @Override
    public void initialize( final BeanContext context )
    {
        nodeServiceSupplier = context.getService( NodeService.class );
    }

    public String list( final String repositoryName, final String branchName, final String path, final String propertyPath, final int start,
                        final int count )
    {
        return runSafely( () -> {
            final RcdJsonObject result = RcdJsonService.createJsonObject();
            final RcdJsonArray propertyJsonArray = result.createArray( "hits" );

            final Node node = createContext( RepositoryId.from( repositoryName ), Branch.from( branchName ) ).
                callWith( () -> this.nodeServiceSupplier.get().getByPath( NodePath.create( path ).build() ) );

            result.put( "total", 0 );
            if ( node != null )
            {

                final PropertySet propertySet = propertyPath == null ? node.data().getRoot() : node.data().getSet( propertyPath );
                if ( propertySet != null )
                {
                    final List<Property> propertyList = (List<Property>) propertySet.getProperties();
                    result.put( "total", propertyList.size() );
                    propertyList.stream().skip( start ).limit( count ).forEach( property -> {
                        String value = "PropertySet".equals( property.getType().getName() ) ? "" : property.getValue().toString();
                        //value = StringEscapeUtils.escapeHtml( value );
                        propertyJsonArray.createObject().
                            put( "name", property.getName() ).
                            put( "index", property.getIndex() ).
                            put( "value", value ).
                            put( "type", property.getType().toString() );
                    } );
                }
            }
            return createSuccessResult( result );
        }, "Error while listing properties" );
    }

    public String update( final String repositoryName, final String branchName, final String path, final String propertyPath, final String type,
                          final String valueString )
    {
        return runSafely( () -> {
            NodeEditor nodeEditor = ( editableNode ) -> {
                final Value value = createValue( type, valueString );

                //TODO Workaround. Bug if existing property with different type
                final Property property = editableNode.data.getProperty( propertyPath );
                final int propertiesCount = property.getParent().countProperties( property.getName() );
                if ( propertiesCount == 1 )
                {
                    editableNode.data.removeProperty( propertyPath );
                }

                editableNode.data.setProperty( propertyPath, value );
            };
            final UpdateNodeParams updateNodeParams = UpdateNodeParams.create().
                path( NodePath.create( path ).build() ).
                editor( nodeEditor ).
                build();
            createContext( RepositoryId.from( repositoryName ), Branch.from( branchName ) ).
                callWith( () -> this.nodeServiceSupplier.get().update( updateNodeParams ) );

            return createSuccessResult();
        }, "Error while editing property" );
    }

    public String create( final String repositoryName, final String branchName, final String path, final String parentPath,
                          final String name, final String type, final String valueString )
    {
        return runSafely( () -> {
            NodeEditor nodeEditor = ( editableNode ) -> {
                final Value value = createValue( type, valueString );
                final PropertySet parentPropertySet =
                    parentPath != null ? editableNode.data.getPropertySet( parentPath ) : editableNode.data.getRoot();
                parentPropertySet.addProperty( name, value );
            };
            final UpdateNodeParams updateNodeParams = UpdateNodeParams.create().
                path( NodePath.create( path ).build() ).
                editor( nodeEditor ).
                build();
            createContext( RepositoryId.from( repositoryName ), Branch.from( branchName ) ).
                callWith( () -> this.nodeServiceSupplier.get().update( updateNodeParams ) );

            return createSuccessResult();
        }, "Error while creating property" );
    }

    public String delete( final String repositoryName, final String branchName, final String path, final String parentPath,
                          final ScriptObjectMirror properties )
    {
        return runSafely( () -> {
            NodeEditor nodeEditor = ( editableNode ) -> {
                final PropertySet parentPropertySet =
                    parentPath != null ? editableNode.data.getPropertySet( parentPath ) : editableNode.data.getRoot();

                Arrays.stream( properties.getOwnKeys( true ) ).forEach( propertyName -> {
                    final Integer[] indexes = ( (ScriptObjectMirror) properties.getMember( propertyName ) ).to( Integer[].class );
                    Arrays.stream( indexes ).sorted( Comparator.reverseOrder() ).forEach(
                        index -> parentPropertySet.removeProperty( propertyName + "[" + index + "]" ) );
                } );
            };
            final UpdateNodeParams updateNodeParams = UpdateNodeParams.create().
                path( NodePath.create( path ).build() ).
                editor( nodeEditor ).
                build();
            createContext( RepositoryId.from( repositoryName ), Branch.from( branchName ) ).
                callWith( () -> this.nodeServiceSupplier.get().update( updateNodeParams ) );

            return createSuccessResult();
        }, "Error while deleting properties" );
    }

    private Value createValue( String type, String value )
    {
        switch ( type )
        {
            case "BinaryReference":
                return ValueFactory.newBinaryReference( BinaryReference.from( value ) );
            case "Boolean":
                return ValueFactory.newBoolean( Boolean.parseBoolean( value ) );
            case "DateTime":
                return ValueFactory.newDateTime( Instant.parse( value ) );
            case "Double":
                return ValueFactory.newDouble( Double.parseDouble( value ) );
            case "GeoPoint":
                return ValueFactory.newGeoPoint( GeoPoint.from( value ) );
            case "Link":
                return ValueFactory.newLink( Link.from( value ) );
            case "LocalDate":
                return ValueFactory.newLocalDate( LocalDate.parse( value ) );
            case "LocalDateTime":
                return ValueFactory.newLocalDateTime( LocalDateTime.parse( value ) );
            case "LocalTime":
                return ValueFactory.newLocalTime( LocalTime.parse( value ) );
            case "Long":
                return ValueFactory.newLong( Long.parseLong( value ) );
            case "PropertySet":
                return ValueFactory.newPropertySet( new PropertySet() );
            case "Reference":
                return ValueFactory.newReference( Reference.from( value ) );
            case "String":
                return ValueFactory.newString( value );
            case "Xml":
                return ValueFactory.newXml( value );
            default:
                throw new RcdException( "Unknown Property value type [" + type + "]", null );
        }
    }

}
