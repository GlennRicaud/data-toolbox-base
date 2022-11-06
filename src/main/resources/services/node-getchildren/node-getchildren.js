const nodeLib = require('/lib/xp/node');
const escapeLib = require('/lib/escape');
const utilLib = require('/lib/util');

exports.post = function (req) {
    const body = JSON.parse(req.body);
    const repositoryName = body.repositoryName;
    const branchName = body.branchName;
    const parentPath = body.parentPath;
    const start = body.start || 0;
    const count = body.count || 50;
    const filter = body.filter ? decodeURIComponent(body.filter) : undefined;
    const sort = body.sort ? decodeURIComponent(body.sort) : undefined;

    const result = utilLib.runSafely(getChildren, [repositoryName, branchName, parentPath, start, count, filter, sort],
        'Error while getting children nodes');
    return {
        contentType: 'application/json',
        body: result
    };
};

function getChildren(repositoryName, branchName, parentPath, start, count, filter, sort) {
    const repoConnection = nodeLib.connect({
        repoId: repositoryName,
        branch: branchName
    });

    if (parentPath) {
        let result;
        if (filter) {
            result = repoConnection.query({
                query: '_parentPath = \'' + parentPath + '\' AND ' + filter,
                start: start,
                count: count,
                sort: sort
            });
        } else {
            result = repoConnection.findChildren({
                parentKey: parentPath,
                start: start,
                count: count,
                childOrder: sort
            });
        }

        return {
            success: {
                hits: result.hits.map(function (resultHit) {
                    const node = repoConnection.get(resultHit.id);
                    return escapeLib.escapeHtml(node);
                }),
                count: result.count,
                total: result.total
            }
        };
    } else {
        const rootNode = repoConnection.get('/');
        if (rootNode) {
            rootNode._name = "[root]"
        }
        return {
            success: {
                hits: rootNode ? [rootNode] : [],
                count: rootNode ? 1 : 0,
                total: rootNode ? 1 : 0
            }
        };
    }
}