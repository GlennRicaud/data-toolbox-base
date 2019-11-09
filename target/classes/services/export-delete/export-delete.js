var taskLib = require('/lib/xp/task');

exports.post = function (req) {
    var bean = __.newBean('systems.rcd.enonic.datatoolbox.RcdExportScriptBean');
    var exportNames = JSON.parse(req.body).exportNames;

    var taskId = taskLib.submit({
        description: 'Export deletion',
        task: function () {
            taskLib.progress({info: 'Deleting exports (0/' + exportNames.length + ')...'});
            taskLib.progress({info: bean.delete(exportNames)});
        }
    });

    return {
        contentType: 'application/json',
        body: {taskId: taskId}
    }
};