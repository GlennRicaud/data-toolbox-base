const repoLib = require('/lib/xp/repo');

exports.post = function (req) {
    const repositoryName = JSON.parse(req.body).repositoryName;

    const result = runSafely(listRepositories, repositoryName);
    return {
        contentType: 'application/json',
        body: result
    }
};

function listRepositories(repositoryName) {

    const repository = repoLib.get(repositoryName);
    return {
        success: {
            name: repository.id,
            branches: repository.branches
        }
    };
}

function runSafely(runnable, parameter) {
    try {
        return runnable(parameter);
    } catch (e) {
        return {
            error: 'Error while listing repositories: ' + e.message
        }
    }
}