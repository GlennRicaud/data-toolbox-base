var nodeLib = require('/lib/xp/node');

exports.post = function (req) {
    var body = JSON.parse(req.body);
    var repositoryName = body.repositoryName;
    var branchName = body.branchName;
    var parentPath = body.parentPath;
    var start = body.start || 0;
    var count = body.count || 50;
    var filter = body.filter ? decodeURIComponent(body.filter) : undefined;
    var sort = body.sort ? decodeURIComponent(body.sort) : undefined;

    var result = runSafely(getChildren, [repositoryName, branchName, parentPath, start, count, filter, sort]);
    return {
        contentType: 'application/json',
        body: result
    };
};

function getChildren(repositoryName, branchName, parentPath, start, count, filter, sort) {
    var repoConnection = nodeLib.connect({
        repoId: repositoryName,
        branch: branchName
    });

    if (parentPath) {
        var result;
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
                    return repoConnection.get(resultHit.id);
                }),
                count: result.count,
                total: result.total
            }
        };
    } else {
        var rootNode = repoConnection.get('/');
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

function runSafely(runnable, parameters) {
    try {
        return runnable.apply(null, parameters);
    } catch (e) {
        return {
            error: 'Error while getting children nodes: ' + e.message
        }
    }
}