var nodeLib = require('/lib/xp/node');
var repoLib = require('/lib/xp/repo');
var utilLib = require('/lib/util');

exports.post = function (req) {
    var body = JSON.parse(req.body);
    var repositoryName = body.repositoryName;
    var branchName = body.branchName;
    var query = body.query;
    var start = body.start || 0;
    var count = body.count || 10;
    var sort = body.sort ? decodeURIComponent(body.sort) : undefined;

    var result = runSafely(doQuery, [repositoryName, branchName, query, start, count, sort]);
    return {
        contentType: 'application/json',
        body: result
    };
};

function doQuery(repositoryName, branchName, query, start, count, sort) {
    var repoConnection;
    if (repositoryName && branchName) {
        repoConnection = nodeLib.connect({
            repoId: repositoryName,
            branch: branchName
        });
    } else if (repositoryName) {
        var sources = [];
        repoLib.get(repositoryName).branches.forEach(function (branch) {
            sources.push({
                repoId: repositoryName,
                branch: branch,
                principals: ["role:system.admin"] //Why is this mandatory
            });
        });
        repoConnection = nodeLib.multiRepoConnect({
            sources: sources
        });
    } else {
        var sources = [];
        repoLib.list().forEach(function (repository) {
            repository.branches.forEach(function (branch) {
                sources.push({
                    repoId: repository.id,
                    branch: branch,
                    principals: ["role:system.admin"] //Why is this mandatory
                });
            });
        });
        repoConnection = nodeLib.multiRepoConnect({
            sources: sources
        });
    }

    var result = repoConnection.query({
        query: query,
        start: start,
        count: count,
        sort: sort
    });


    var hits;
    if (repositoryName && branchName) {
        var ids = result.hits.map(function (hit) {
            return hit.id;
        });
        hits = utilLib.forceArray(repoConnection.get(ids)).map(function (node) {
            return {
                repositoryName: repositoryName,
                branchName: branchName,
                _id: node._id,
                _name: node._name,
                _path: node._path
            };
        })
    } else {
        hits = result.hits.map(function (hit) {
            var node = nodeLib.connect({
                repoId: hit.repoId,
                branch: hit.branch
            }).get(hit.id);
            return {
                repositoryName: hit.repoId,
                branchName: hit.branch,
                _id: node._id,
                _name: node._name,
                _path: node._path
            };
        });
    }

    return {
        success: {
            hits: hits,
            count: result.count,
            total: result.total
        }
    };
}

function runSafely(runnable, parameters) {
    try {
        return runnable.apply(null, parameters);
    } catch (e) {
        log.error(e);
        //throw e;
        return {
            error: 'Error while querying nodes: ' + (e.message || e)
        }
    }
}