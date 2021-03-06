const nodeLib = require('/lib/xp/node');
const taskLib = require('/lib/xp/task');
const utilLib = require('/lib/util');

exports.post = function (req) {
    const body = JSON.parse(req.body);
    const repositoryName = body.repositoryName;
    const branchName = body.branchName;
    const keys = body.keys;

    const taskId = taskLib.submit({
        description: 'Node deletion',
        task: function () {
            taskLib.progress({info: 'Deleting nodes...'});
            const result = utilLib.runSafely(deleteNodes, [repositoryName, branchName, keys], 'Error while deleting nodes')
            taskLib.progress({info: JSON.stringify(result)});
        }
    });

    return {
        contentType: 'application/json',
        body: {taskId: taskId}
    };
};

function deleteNodes(repositoryName, branchName, keys) {
    const repoConnection = nodeLib.connect({
        repoId: repositoryName,
        branch: branchName
    });

    return {
        success: repoConnection.delete(keys).length
    };
}