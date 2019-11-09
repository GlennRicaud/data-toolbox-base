var nodeLib = require('/lib/xp/node');
var escapeLib = require('/lib/escape');
var exceptionLib = require('/lib/exception');

exports.post = function (req) {
    var body = JSON.parse(req.body);
    var repositoryName = body.repositoryName;
    var branchName = body.branchName;
    var key = body.key;

    var result = exceptionLib.runSafely(getNode, [repositoryName, branchName, key], 'Error while retrieving node');
    return {
        contentType: 'application/json',
        body: result
    };
};

function getNode(repositoryName, branchName, key) {
    var repoConnection = nodeLib.connect({
        repoId: repositoryName,
        branch: branchName
    });

    var result = repoConnection.get(key);
    var escapedResult = escapeLib.escapeHtml(result);

    return {
        success: escapedResult
    };
}