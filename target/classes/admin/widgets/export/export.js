var authLib = require('/lib/xp/auth');
var contentLib = require('/lib/xp/content');
var contextLib = require('/lib/xp/context');
var mustacheLib = require('/lib/mustache');
var portalLib = require('/lib/xp/portal');

exports.get = function (req) {
    var hasAdminRole = authLib.hasRole('system.admin');
    if (!hasAdminRole) {
        return null;
    }

    var repositoryName = req.params.repository || 'com.enonic.cms.default';
    var branchName = req.params.branch || 'draft';
    var content = req.params.contentId ? contextLib.run({
        repository: repositoryName,
        branch: branchName
    }, function () {
        return contentLib.get({key: req.params.contentId});
    }) : null;
    var view = resolve("export.html");
    var body = mustacheLib.render(view, {
        adminRestUrl: portalLib.url({path: "/admin/rest"}),
        servicesUrl: portalLib.serviceUrl({service: ""}),
        assetsUrl: portalLib.assetUrl({path: ""}),
        cmsRepositoryShortName: repositoryName.substring('com.enonic.cms.'.length),
        branchName: branchName,
        contentPath: content ? content._path : '/',
        contentName: content ? content._name : 'content'
    });
    return {
        body: body,
        contentType: 'text/html'
    };
};