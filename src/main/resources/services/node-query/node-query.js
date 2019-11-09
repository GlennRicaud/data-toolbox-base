const nodeLib = require('/lib/xp/node');
const repoLib = require('/lib/xp/repo');
const utilLib = require('/lib/util');

exports.post = function (req) {
    const body = JSON.parse(req.body);
    const repositoryName = body.repositoryName;
    const branchName = body.branchName;
    const query = body.query;
    const start = body.start || 0;
    const count = body.count || 10;
    const sort = body.sort ? decodeURIComponent(body.sort) : undefined;

    const result = runSafely(doQuery, [repositoryName, branchName, query, start, count, sort]);
    return {
        contentType: 'application/json',
        body: result
    };
};

function doQuery(repositoryName, branchName, query, start, count, sort) {
    const repoConnection;
    if (repositoryName && branchName) {
        repoConnection = nodeLib.connect({
            repoId: repositoryName,
            branch: branchName
        });
    } else if (repositoryName) {
        const sources = [];
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
        const sources = [];
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

    const result = repoConnection.query({
        query: query,
        start: start,
        count: count,
        sort: sort
    });


    let hits;
    if (repositoryName && branchName) {
        const ids = result.hits.map(function (hit) {
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
            const node = nodeLib.connect({
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