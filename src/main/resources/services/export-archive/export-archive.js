const taskLib = require('/lib/xp/task');

exports.post = function (req) {
    const bean = __.newBean('systems.rcd.enonic.datatoolbox.RcdExportScriptBean');
    const exportNames = JSON.parse(req.body).exportNames;

    const taskId = taskLib.submit({
        description: 'Export archiving',
        task: function () {
            taskLib.progress({info: 'Archiving exports...'});
            taskLib.progress({info: bean.archive(exportNames)});
        }
    });

    return {
        contentType: 'application/json',
        body: {taskId: taskId}
    }
};