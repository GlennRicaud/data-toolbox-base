const repoLib = require('/lib/xp/repo');
const utilLib = require('/lib/util');

exports.post = function (req) {
    const repositoryName = JSON.parse(req.body).repositoryName;

    const result = utilLib.runSafely(createRepository, [repositoryName], 'Error while creating repository');
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