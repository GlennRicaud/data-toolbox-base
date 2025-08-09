const taskLib = require('/lib/xp/task');

exports.post = function (req) {
    const bean = __.newBean('systems.rcd.enonic.datatoolbox.RcdSnapshotScriptBean');
    const body = JSON.parse(req.body);
    const snapshotName = body.snapshotName;

    const taskId = taskLib.executeFunction({
        description: 'Snapshot creation',
        func: function () {
            taskLib.progress({info: 'Creating snapshot...'});
            taskLib.progress({info: bean.create(snapshotName)});
        }
    });

    return {
        contentType: 'application/json',
        body: {taskId: taskId}
    }
};