const repoLib = require('/lib/xp/repo');
const utilLib = require('/lib/util');

exports.post = function (req) {
    const body = JSON.parse(req.body);
    const repositoryName = body.repositoryName;
    const branchNames = body.branchNames;

    const result = utilLib.runSafely(deleteRepositories, [repositoryName, branchNames], 'Error while deleting branch');
    return {
        contentType: 'application/json',
        body: result
    };
};

function deleteRepositories(repositoryName, branchNames) {
    branchNames.forEach(function (branchName) {
        deleteRepository(repositoryName, branchName)
    });
    return {
        success: true
    };
}

function deleteRepository(repositoryName, branchName) {
    repoLib.deleteBranch({
        repoId: repositoryName,
        branchId: branchName
    });
}