const nodeLib = require('/lib/xp/node');
const escapeLib = require('/lib/escape');
const exceptionLib = require('/lib/exception');

exports.post = function (req) {
    const body = JSON.parse(req.body);
    const repositoryName = body.repositoryName;
    const branchName = body.branchName;
    const key = body.key;

    const result = exceptionLib.runSafely(getNode, [repositoryName, branchName, key], 'Error while retrieving node');
    return {
        contentType: 'application/json',
        body: result
    };
};

function getNode(repositoryName, branchName, key) {
    const repoConnection = nodeLib.connect({
        repoId: repositoryName,
        branch: branchName
    });

    const result = repoConnection.get(key);
    const escapedResult = escapeLib.escapeHtml(result);

    return {
        success: escapedResult
    };
}