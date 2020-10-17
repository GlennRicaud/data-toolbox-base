const nodeLib = require('/lib/xp/node');
const queryLib = require('/lib/query');
const utilLib = require('/lib/util');

exports.post = function (req) {
    const body = JSON.parse(req.body);
    const repositoryName = body.repositoryName;
    const branchName = body.branchName;
    const query = body.query;
    const start = body.start || 0;
    const count = body.count == null ? 10 : body.count;
    const sort = body.sort ? decodeURIComponent(body.sort) : undefined;

    const result = utilLib.runSafely(doQuery, [repositoryName, branchName, query, start, count, sort], 'Error while querying nodes');
    return {
        contentType: 'application/json',
        body: result
    };
};

function doQuery(repositoryName, branchName, query, start, count, sort) {
    const repoConnection = queryLib.createRepoConnection(repositoryName, branchName);

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
