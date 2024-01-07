const projectLib = require('/lib/xp/project');
const utilLib = require('/lib/util');

exports.get = function () {
    const result = utilLib.runSafely(listProjects, [], 'Error while listing projects');
    return {
        contentType: 'application/json',
        body: result
    }
};

function listProjects() {
    return {
        success: projectLib.list().
            map(function (repo) {
                return {
                    id: repo.id,
                    displayName: repo.displayName,
                    description: repo.description,
                };
            })
    };
}