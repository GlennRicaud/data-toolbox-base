const mustacheLib = require('/lib/mustache');
const portalLib = require('/lib/xp/portal');

exports.get = () => {
    const view = resolve("data-toolbox.html");
    const xpVersion = Java.type('com.enonic.xp.server.VersionInfo')
        .get()
        .toString();
    const body = mustacheLib.render(view, {
        servicesUrl: portalLib.serviceUrl({service: ""}),
        assetsUrl: portalLib.assetUrl({path: ""}),
        wsUrl: portalLib.url({path: '/admin/event', type: 'absolute'}).replace(/^(http|https)/, 'ws'),
        xpVersion: xpVersion,
        appName : app.name
    });

    return {
        body: body,
        contentType: 'text/html'
    };
};