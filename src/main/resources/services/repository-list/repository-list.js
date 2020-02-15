const repoLib = require('/lib/xp/repo');
const utilLib = require('/lib/util');

exports.get = function () {
    const result = utilLib.runSafely(listRepositories, [], 'Error while listing repositories');
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