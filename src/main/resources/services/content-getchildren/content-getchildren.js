const contentLib = require('/lib/xp/content');
const contextLib = require('/lib/xp/context');
const escapeLib = require('/lib/escape');
const utilLib = require('/lib/util');

exports.post = function (req) {
    const body = JSON.parse(req.body);
    const projectId = body.projectId;
    const branchName = body.branchName || 'draft';
    const parentPath = body.parentPath || '';
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
                query: '_parentPath = \'/content' + parentPath + '\' AND ' + filter,
                start: start,
                count: count,
                sort: sort
            });
        } else {
            return contentLib.getChildren({
                key: parentPath || '/',
                start: start,
                count: count,
                sort: sort
            });
        }
    })

    return {
        success: {
            hits: result.hits.map(function (content) {
                return escapeLib.escapeHtml(content);
            }),
            count: result.count,
            total: result.total
        }
    };
}