const mustacheLib = require('/lib/mustache');
const portalLib = require('/lib/xp/portal');

exports.get = () => {
    const view = resolve("data-toolbox.html");
    const xpVersion = Java.type('com.enonic.xp.server.VersionInfo')
        .get()
        .toString();
    const body = mustacheLib.render(view, {
        adminRestUrl: portalLib.url({path: "/admin/rest"}),
        assetsUrl: portalLib.assetUrl({path: ""}),
        servicesUrl: portalLib.serviceUrl({service: ""}),
        xpVersion: xpVersion
    });

    return {
        body: body,
        contentType: 'text/html'
    };
};