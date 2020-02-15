const nodeLib = require('/lib/xp/node');
const taskLib = require('/lib/xp/task');
const utilLib = require('/lib/util');

exports.post = function (req) {
    const body = JSON.parse(req.body);
    const repositoryName = body.repositoryName;
    const branchName = body.branchName;
    const sources = body.sources;
    const target = body.target;

    const taskId = taskLib.submit({
        description: 'Node move',
        task: function () {
            taskLib.progress({info: 'Moving nodes...'});
            const result = utilLib.runSafely(moveNodes, [repositoryName, branchName, sources, target], 'Error while moving nodes')
            taskLib.progress({info: JSON.stringify(result)});
        }
    });

    return {
        contentType: 'application/json',
        body: {taskId: taskId}
    };
};

function moveNodes(repositoryName, branchName, sources, target) {
    const repoConnection = nodeLib.connect({
        repoId: repositoryName,
        branch: branchName
    });
    
    const success = sources.map(function(source) {
        return repoConnection.move({
            source: source,
            target: target
        })._path
    });

    return {
        success: success
    };
}