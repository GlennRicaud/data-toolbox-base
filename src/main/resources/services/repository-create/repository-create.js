const repoLib = require('/lib/xp/repo');

exports.post = function (req) {
    const repositoryName = JSON.parse(req.body).repositoryName;

    const result = runSafely(createRepository, repositoryName);
    return {
        contentType: 'application/json',
        body: result
    };
};

function createRepository(repositoryName) {
    repoLib.create({
        id: repositoryName
    });
    return {
        success: true
    };
}

function runSafely(runnable, parameter) {
    try {
        return runnable(parameter);
    } catch (e) {
        return {
            error: 'Error while creating repository: ' + e.message
        }
    }
}