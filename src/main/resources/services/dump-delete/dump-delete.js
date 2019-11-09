var taskLib = require('/lib/xp/task');

exports.post = function (req) {
    var bean = __.newBean('systems.rcd.enonic.datatoolbox.RcdDumpScriptBean');
    var dumpNames = JSON.parse(req.body).dumpNames;

    var taskId = taskLib.submit({
        description: 'Dump deletion',
        task: function () {
            taskLib.progress({info: 'Deleting dumps (0/' + dumpNames.length + ')...'});
            taskLib.progress({info: bean.delete(dumpNames)});
        }
    });

    return {
        contentType: 'application/json',
        body: {taskId: taskId}
    }
};