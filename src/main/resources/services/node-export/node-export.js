const taskLib = require('/lib/xp/task');

exports.post = function (req) {
    const bean = __.newBean('systems.rcd.enonic.datatoolbox.RcdExportScriptBean');
    const body = JSON.parse(req.body);
    const repositoryName = body.repositoryName;
    const branchName = body.branchName;
    const nodePath = body.nodePath;
    const exportName = body.exportName;

    const taskId = taskLib.submit({
        description: 'Node export',
        task: function () {
            taskLib.progress({info: 'Exporting nodes...'});
            taskLib.progress({info: bean.create(repositoryName, branchName, nodePath, exportName)});
        }
    });

    return {
        contentType: 'application/json',
        body: {taskId: taskId}
    }
};