package systems.rcd.enonic.datatoolbox;

import com.enonic.xp.app.Application;
import com.enonic.xp.app.ApplicationKey;
import com.enonic.xp.app.ApplicationService;
import com.enonic.xp.home.HomeDir;
import com.enonic.xp.script.bean.BeanContext;
import com.enonic.xp.server.VersionInfo;
import systems.rcd.fwk.core.format.json.RcdJsonService;
import systems.rcd.fwk.core.format.json.data.RcdJsonObject;

import java.io.File;
import java.nio.file.Path;
import java.util.function.Supplier;

public class RcdHomeScriptBean
        extends RcdScriptBean {

    public String getInfo() {
        return runSafely(() -> {
            final RcdJsonObject info = RcdJsonService.createJsonObject();
            addSpaceInfo(info, "home", null);
            addSpaceInfo(info, "repo", "repo");
            addSpaceInfo(info, "work", "work");
            addSpaceInfo(info, "snapshots", "snapshots");
            addSpaceInfo(info, "data", "data");
            return createSuccessResult(info);
        }, "Error while retrieving home information");
    }

    private void addSpaceInfo(RcdJsonObject info, String key, String path) {
        File file = HomeDir.get().toFile();
        if (path != null) {
            file = file.toPath().resolve(path).toFile();
        }
        RcdJsonObject dirInfo = info.createObject(key);
        dirInfo.put("free", file.getFreeSpace());
        dirInfo.put("total", file.getTotalSpace());
        dirInfo.put("usable", file.getUsableSpace());
    }

    @Override
    public void initialize(final BeanContext context) {
    }
}
