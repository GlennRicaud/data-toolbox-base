const repoLib = require('/lib/xp/repo');
const utilLib = require('/lib/util');

exports.post = function (req) {
    const body = JSON.parse(req.body);
    const repositoryName = body.repositoryName;
    const branchName = body.branchName;

    const result = utilLib.runSafely(createRepository, [repositoryName, branchName], 'Error while creating repository');
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