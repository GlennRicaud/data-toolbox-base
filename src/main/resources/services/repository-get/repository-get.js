const repoLib = require('/lib/xp/repo');
const utilLib = require('/lib/util');

exports.post = function (req) {
    const repositoryName = JSON.parse(req.body).repositoryName;

    const result = utilLib.runSafely(listRepositories, [repositoryName], 'Error while retrieving repository');
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