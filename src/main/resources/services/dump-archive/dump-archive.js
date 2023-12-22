const taskLib = require('/lib/xp/task');

exports.post = function (req) {
    const bean = __.newBean('systems.rcd.enonic.datatoolbox.RcdDumpScriptBean');
    const dumpNames = JSON.parse(req.body).dumpNames;

    const taskId = taskLib.submit({
        description: 'Dump archiving',
        task: function () {
            taskLib.progress({info: 'Archiving dumps...'});

            const listener = __.toScriptValue(
                (count) => {
                    if (count > 0) {
                        taskLib.progress({info: 'Archiving dumps... (' + count + ' files archived)'});
                    }
                });

            taskLib.progress({info: bean.archive(listener, dumpNames)});
        }
    });

    return {
        contentType: 'application/json',
        body: {taskId: taskId}
    }
};