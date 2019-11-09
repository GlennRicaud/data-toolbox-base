var taskLib = require('/lib/xp/task');

exports.post = function (req) {
    var bean = __.newBean('systems.rcd.enonic.datatoolbox.RcdDumpScriptBean');
    var dumpNames = JSON.parse(req.body).dumpNames;

    var taskId = taskLib.submit({
        description: 'Dump archiving',
        task: function () {
            taskLib.progress({info: 'Archiving dumps...'});
            taskLib.progress({info: bean.archive(dumpNames)});
        }
    });

    return {
        contentType: 'application/json',
        body: {taskId: taskId}
    }
};