const contentLib = require('/lib/xp/content');
const contextLib = require('/lib/xp/context');
const utilLib = require('/lib/util');

exports.post = function (req) {
    const body = JSON.parse(req.body);
    const projectId = body.projectId;
    const id = body.id;

    const result = utilLib.runSafely(restoreContent, [projectId, id], 'Error while restoring content');
    return {
        contentType: 'application/json',
        body: result
    };
};

function restoreContent(projectId, id) {
    contextLib.run({
        repository: 'com.enonic.cms.' + projectId
    }, function () {
        contentLib.restore({
            content: id,
        })
    });
    return {
        success: true
    };
}