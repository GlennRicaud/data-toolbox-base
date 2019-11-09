const authLib = require('/lib/xp/auth');
const contentLib = require('/lib/xp/content');
const contextLib = require('/lib/xp/context');
const mustacheLib = require('/lib/mustache');
const portalLib = require('/lib/xp/portal');

exports.get = (req) => {
    const hasAdminRole = authLib.hasRole('system.admin');
    if (!hasAdminRole) {
        return null;
    }

    const repositoryName = req.params.repository || 'com.enonic.cms.default';
    const branchName = req.params.branch || 'draft';
    const content = req.params.contentId ? contextLib.run({
        repository: repositoryName,
        branch: branchName
    }, function () {
        return contentLib.get({key: req.params.contentId});
    }) : null;
    const view = resolve("export.html");
    const body = mustacheLib.render(view, {
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