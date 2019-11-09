const taskLib = require('/lib/xp/task');

exports.post = function (req) {
    const bean = __.newBean('systems.rcd.enonic.datatoolbox.RcdDumpScriptBean');
    const dumpNames = JSON.parse(req.body).dumpNames;

    const taskId = taskLib.submit({
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