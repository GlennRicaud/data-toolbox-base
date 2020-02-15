const repoLib = require('/lib/xp/repo');
const utilLib = require('/lib/util');

exports.post = function (req) {
    const repositoryNames = JSON.parse(req.body).repositoryNames;

    let result;
    if (repositoryNames.some(isProtectedAgainstDeletion)) {
        result = {
            error: 'The repositories [com.enonic.cms.default] and [system-repo] cannot be deleted.'
        };
    } else {
        result = utilLib.runSafely(deleteRepositories, [repositoryNames], 'Error while deleting repositories');
    }
    return {
        contentType: 'application/json',
        body: result
    };
};

function isProtectedAgainstDeletion(repositoryName) {
    return "com.enonic.cms.default" === repositoryName || "system-repo" === repositoryName;
}

function deleteRepositories(repositoryNames) {
    repositoryNames.forEach(deleteRepository);
    return {
        success: true
    };
}

function deleteRepository(repositoryName) {
    repoLib.delete(repositoryName);
}