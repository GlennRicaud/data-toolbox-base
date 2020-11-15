const nodeLib = require('/lib/xp/node');
const repoLib = require('/lib/xp/repo');

function createRepoConnection(repositoryName, branchName) {
    if (repositoryName && branchName) {
        return nodeLib.connect({
            repoId: repositoryName,
            branch: branchName
        });
    } else {
        const sources = [];

        if (repositoryName) {
            repoLib.get(repositoryName).branches.forEach(function (branch) {
                sources.push({
                    repoId: repositoryName,
                    branch: branch,
                    principals: ["role:system.admin"] //Why is this mandatory
                });
            });
        } else {
            repoLib.list().forEach(function (repository) {
                repository.branches.forEach(function (branch) {
                    sources.push({
                        repoId: repository.id,
                        branch: branch,
                        principals: ["role:system.admin"] //Why is this mandatory
                    });
                });
            });
        }
        return nodeLib.multiRepoConnect({
            sources: sources
        });
    }
}

exports.createRepoConnection = createRepoConnection;