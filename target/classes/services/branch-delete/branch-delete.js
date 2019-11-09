var repoLib = require('/lib/xp/repo');

exports.post = function (req) {
    var body = JSON.parse(req.body);
    var repositoryName = body.repositoryName;
    var branchNames = body.branchNames;

    var result = runSafely(deleteRepositories, [repositoryName, branchNames]);
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