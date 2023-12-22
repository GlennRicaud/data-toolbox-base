const taskLib = require('/lib/xp/task');

exports.post = function (req) {
    const bean = __.newBean('systems.rcd.enonic.datatoolbox.RcdExportScriptBean');
    const exportNames = JSON.parse(req.body).exportNames;

    const taskId = taskLib.submit({
        description: 'Export archiving',
        task: function () {
            taskLib.progress({info: 'Archiving exports...'});
            const listener = __.toScriptValue(
                (count) => {
                    if (count > 0) {
                        taskLib.progress({info: 'Archiving exports... (' + count + ' files archived)'});
                    }
                });
            taskLib.progress({info: bean.archive(listener, exportNames)});
        }
    });

    return {
        contentType: 'application/json',
        body: {taskId: taskId}
    }
};