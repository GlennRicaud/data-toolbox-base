const nodeLib = require('/lib/xp/node');
const taskLib = require('/lib/xp/task');
const utilLib = require('/lib/util');

exports.post = function (req) {
    const body = JSON.parse(req.body);
    const repositoryName = body.repositoryName;
    const branchName = body.branchName;
    const nodeKey = body.nodeKey;
    const target = body.target;

    const taskId = taskLib.submit({
        description: 'Node push',
        task: function () {
            taskLib.progress({info: 'Pushing nodes...'});
            const result = utilLib.runSafely(pushNodes, [repositoryName, branchName, nodeKey, target], 'Error while pushing nodes')
            taskLib.progress({info: JSON.stringify(result)});
        }
    });

    return {
        contentType: 'application/json',
        body: {taskId: taskId}
    };
};

function pushNodes(repositoryName, branchName, key, target) {
    const repoConnection = nodeLib.connect({
        repoId: repositoryName,
        branch: branchName
    });

    return {
        success: repoConnection.push({
            key: key,
            target: target
        })
    };
}