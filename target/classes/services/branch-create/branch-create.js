var repoLib = require('/lib/xp/repo');

exports.post = function (req) {
    var body = JSON.parse(req.body);
    var repositoryName = body.repositoryName;
    var branchName = body.branchName;

    var result = runSafely(createRepository, [repositoryName, branchName]);
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