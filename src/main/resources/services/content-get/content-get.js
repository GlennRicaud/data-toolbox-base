const contentLib = require('/lib/xp/content');
const contextLib = require('/lib/xp/context');
const escapeLib = require('/lib/escape');
const utilLib = require('/lib/util');

exports.post = function (req) {
    const body = JSON.parse(req.body);
    const projectId = body.projectId;
    const branchName = body.branchName || 'draft';
    const key = body.key;

    const result = utilLib.runSafely(getContent, [projectId, branchName, key], 'Error while retrieving content');
    return {
        contentType: 'application/json',
        body: result
    };
};

function getContent(projectId, branchName, key) {
    return contextLib.run({
        repository: 'com.enonic.cms.' + projectId,
        branch: branchName
    }, function () {
        const result = contentLib.get({key:key});
        const escapedResult = escapeLib.escapeHtml(result);
        return {
            success: escapedResult
        };
    });
}