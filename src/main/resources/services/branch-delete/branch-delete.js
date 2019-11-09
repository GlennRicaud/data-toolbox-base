const repoLib = require('/lib/xp/repo');

exports.post = function (req) {
    const body = JSON.parse(req.body);
    const repositoryName = body.repositoryName;
    const branchNames = body.branchNames;

    const result = runSafely(deleteRepositories, [repositoryName, branchNames]);
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

function runSafely(runnable, parameters) {
    try {
        return runnable.apply(null, parameters);
    } catch (e) {
        return {
            error: 'Error while deleting repository: ' + e.message
        }
    }
}