const nodeLib = require('/lib/xp/node');
const utilLib = require('/lib/util');

exports.post = function (req) {
    const body = JSON.parse(req.body);
    const repositoryName = body.repositoryName;
    const branchName = body.branchName;
    const key = body.key;

    const result = utilLib.runSafely(getPermissions, [repositoryName, branchName, key], 'Error while retrieving permissions');
    return {
        contentType: 'application/json',
        body: result
    };
};

function getPermissions(repositoryName, branchName, key) {
    const repoConnection = nodeLib.connect({
        repoId: repositoryName,
        branch: branchName
    });

    const result = repoConnection.get(key);

    return {
        success: {
            _inheritsPermissions: result._inheritsPermissions,
            _permissions: result._permissions
        }
    };
}