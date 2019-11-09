const repoLib = require('/lib/xp/repo');

exports.post = function (req) {
    const body = JSON.parse(req.body);
    const repositoryName = body.repositoryName;
    const branchName = body.branchName;

    const result = runSafely(createRepository, [repositoryName, branchName]);
    return {
        contentType: 'application/json',
        body: result
    };
};

function createRepository(repositoryName, branchName) {
    repoLib.createBranch({
        repoId: repositoryName,
        branchId: branchName
    });
    return {
        success: true
    };
}

function runSafely(runnable, parameters) {
    try {
        return runnable.apply(null, parameters);
    } catch (e) {
        return {
            error: 'Error while creating repository: ' + e.message
        }
    }
}