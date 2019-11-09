var nodeLib = require('/lib/xp/node');
var taskLib = require('/lib/xp/task');

exports.post = function (req) {
    var body = JSON.parse(req.body);
    var repositoryName = body.repositoryName;
    var branchName = body.branchName;
    var sources = body.sources;
    var target = body.target;

    var taskId = taskLib.submit({
        description: 'Node move',
        task: function () {
            taskLib.progress({info: 'Moving nodes...'});
            var result = runSafely(moveNodes, [repositoryName, branchName, sources, target])
            taskLib.progress({info: JSON.stringify(result)});
        }
    });

    return {
        contentType: 'application/json',
        body: {taskId: taskId}
    };
};

function moveNodes(repositoryName, branchName, sources, target) {
    var repoConnection = nodeLib.connect({
        repoId: repositoryName,
        branch: branchName
    });
    
    var success = sources.map(function(source) {
        return repoConnection.move({
            source: source,
            target: target
        })._path
    });

    return {
        success: success
    };
}

function runSafely(runnable, parameters) {
    try {
        return runnable.apply(null, parameters);
    } catch (e) {
        return {
            error: 'Error while moving nodes: ' + e.message
        }
    }
}