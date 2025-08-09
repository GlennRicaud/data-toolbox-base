const taskLib = require('/lib/xp/task');

exports.post = function (req) {
    const bean = __.newBean('systems.rcd.enonic.datatoolbox.RcdExportScriptBean');
    const exportNames = JSON.parse(req.body).exportNames;

    const taskId = taskLib.executeFunction({
        description: 'Export deletion',
        func: function () {
            taskLib.progress({info: 'Deleting exports (0/' + exportNames.length + ')...'});
            taskLib.progress({info: bean.delete(exportNames)});
        }
    });

    return {
        contentType: 'application/json',
        body: {taskId: taskId}
    }
};