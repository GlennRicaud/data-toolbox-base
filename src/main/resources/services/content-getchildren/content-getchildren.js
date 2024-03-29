const contentLib = require('/lib/xp/content');
const contextLib = require('/lib/xp/context');
const nodeLib = require('/lib/xp/node');
const escapeLib = require('/lib/escape');
const utilLib = require('/lib/util');

exports.post = function (req) {
    const body = JSON.parse(req.body);
    const projectId = body.projectId;
    const branchName = body.branchName || 'draft';
    const parentPath = body.parentPath;
    const start = body.start || 0;
    const count = body.count || 50;
    const filter = body.filter ? decodeURIComponent(body.filter) : undefined;
    const sort = body.sort ? decodeURIComponent(body.sort) : undefined;

    const result = utilLib.runSafely(getChildren, [projectId, branchName, parentPath, start, count, filter, sort],
        'Error while getting children contents');
    return {
        contentType: 'application/json',
        body: result
    };
};

function getChildren(projectId, branchName, parentPath, start, count, filter, sort) {
    const result = contextLib.run({
        repository: 'com.enonic.cms.' + projectId,
        branch: branchName
    }, function () {

        if (filter) {
            return contentLib.query({
                query: '_parentPath = \'/content' + (parentPath == '/' ? '' : parentPath) + '\' AND ' + filter,
                start: start,
                count: count,
                sort: sort
            });
        } else {
            return contentLib.getChildren({
                key: parentPath,
                start: start,
                count: count,
                sort: sort
            });
        }
    })

    //Retrieves the state from the node.
    const repoConnection = nodeLib.connect({
        repoId: 'com.enonic.cms.' + projectId,
        branch: branchName
    });
    const contents = result.hits.map(function (content) {
        content._state = repoConnection.get(content._id)._state;
        return escapeLib.escapeHtml(content);
    })

    return {
        success: {
            hits: contents,
            count: result.count,
            total: result.total
        }
    };
}