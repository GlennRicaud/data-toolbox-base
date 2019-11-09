var nodeLib = require('/lib/xp/node');
var taskLib = require('/lib/xp/task');

exports.post = function (req) {
    var body = JSON.parse(req.body);
    var repositoryName = body.repositoryName;
    var branchName = body.branchName;
    var keys = body.keys;

    var taskId = taskLib.submit({
        description: 'Node deletion',
        task: function () {
            taskLib.progress({info: 'Deleting nodes...'});
            var result = runSafely(deleteNodes, [repositoryName, branchName, keys])
            taskLib.progress({info: JSON.stringify(result)});
        }
    });

    return {
        contentType: 'application/json',
        body: {taskId: taskId}
    };
};

function deleteNodes(repositoryName, branchName, keys) {
    var repoConnection = nodeLib.connect({
        repoId: repositoryName,
        branch: branchName
    });

    return {
        success: repoConnection.delete(keys).length
    };
}

function runSafely(runnable, parameters) {
    try {
        return runnable.apply(null, parameters);
    } catch (e) {
        return {
            error: 'Error while deleting nodes: ' + e.message
        }
    }
}