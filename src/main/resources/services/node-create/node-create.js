const nodeLib = require('/lib/xp/node');
const utilLib = require('/lib/util');

exports.post = function (req) {
    const body = JSON.parse(req.body);
    const repositoryName = body.repositoryName;
    const branchName = body.branchName;
    const parentPath = body.parentPath;
    const name = body.name;

    const result = utilLib.runSafely(getNode, [repositoryName, branchName, parentPath, name], 'Error while creating node');
    return {
        contentType: 'application/json',
        body: result
    };
};

function getNode(repositoryName, branchName, parentPath, name) {
    const repoConnection = nodeLib.connect({
        repoId: repositoryName,
        branch: branchName
    });

    const result = repoConnection.create({
        _parentPath: parentPath,
        _name: name,
        _inheritsPermissions: true,
    });

    repoConnection.refresh('SEARCH');

    return {
        success: result._name
    };
}