const taskLib = require('/lib/xp/task');

exports.post = function (req) {
    const bean = __.newBean('systems.rcd.enonic.datatoolbox.RcdDumpScriptBean');
    const dumpNames = JSON.parse(req.body).dumpNames;

    const taskId = taskLib.submit({
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