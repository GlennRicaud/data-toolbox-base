var repoLib = require('/lib/xp/repo');

exports.get = function () {
    var result = runSafely(listRepositories);
    return {
        contentType: 'application/json',
        body: result
    }
};

function listRepositories() {
    return {
        success: repoLib.list().
            map(function (repo) {
                return {
                    name: repo.id,
                    branches: repo.branches
                };
            })
    };
}

function runSafely(runnable) {
    try {
        return runnable();
    } catch (e) {
        return {
            error: 'Error while listing repositories: ' + e.message
        }
    }
}