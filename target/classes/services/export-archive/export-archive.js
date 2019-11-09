var taskLib = require('/lib/xp/task');

exports.post = function (req) {
    var bean = __.newBean('systems.rcd.enonic.datatoolbox.RcdExportScriptBean');
    var exportNames = JSON.parse(req.body).exportNames;

    var taskId = taskLib.submit({
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