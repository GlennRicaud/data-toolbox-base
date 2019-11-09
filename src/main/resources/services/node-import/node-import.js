var taskLib = require('/lib/xp/task');

exports.post = function (req) {
    var bean = __.newBean('systems.rcd.enonic.datatoolbox.RcdExportScriptBean');
    var body = JSON.parse(req.body);
    var repositoryName = body.repositoryName;
    var branchName = body.branchName;
    var nodePath = body.nodePath;
    var exportName = body.exportName;

    var taskId = taskLib.submit({
        description: 'Node import',
        task: function () {
            taskLib.progress({info: 'Importing nodes...'});
            taskLib.progress({info: bean.load([exportName], repositoryName, branchName, nodePath)});
        }
    });

    return {
        contentType: 'application/json',
        body: {taskId: taskId}
    }
};