var nodeLib = require('/lib/xp/node');
var exceptionLib = require('/lib/exception');

exports.post = function (req) {
    var body = JSON.parse(req.body);
    var repositoryName = body.repositoryName;
    var branchName = body.branchName;
    var key = body.key;

    var result = exceptionLib.runSafely(getPermissions, [repositoryName, branchName, key], 'Error while retrieving permissions');
    return {
        contentType: 'application/json',
        body: result
    };
};

function getPermissions(repositoryName, branchName, key) {
    var repoConnection = nodeLib.connect({
        repoId: repositoryName,
        branch: branchName
    });

    var result = repoConnection.get(key);

    return {
        success: {
            _inheritsPermissions: result._inheritsPermissions,
            _permissions: result._permissions
        }
    };
}