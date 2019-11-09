package systems.rcd.enonic.datatoolbox;

import java.util.function.Supplier;

import systems.rcd.fwk.core.format.json.RcdJsonService;
import systems.rcd.fwk.core.format.json.data.RcdJsonObject;

import com.enonic.xp.app.Application;
import com.enonic.xp.app.ApplicationKey;
import com.enonic.xp.app.ApplicationService;
import com.enonic.xp.script.bean.BeanContext;
import com.enonic.xp.server.VersionInfo;

public class RcdAboutScriptBean
    extends RcdScriptBean
{
    private ApplicationKey applicationKey;

    private Supplier<ApplicationService> applicationServiceSupplier;

    public String getAboutInfo()
    {
        return runSafely( () -> {
            final RcdJsonObject about = RcdJsonService.createJsonObject();

            final Application application = applicationServiceSupplier.get().
                getInstalledApplication( applicationKey );
            about.createObject( "app" ).
                put( "version", application.getVersion().toString() ).
                put( "xpVersion", VersionInfo.get().toString() );

            return createSuccessResult( about );
        }, "Error while retrieving about information" );
    }

    @Override
    public void initialize( final BeanContext context )
    {
        applicationKey = context.getApplicationKey();
        applicationServiceSupplier = context.getService( ApplicationService.class );
    }

}
