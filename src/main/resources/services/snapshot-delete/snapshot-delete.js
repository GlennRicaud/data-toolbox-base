const taskLib = require('/lib/xp/task');

exports.post = function (req) {
    const bean = __.newBean('systems.rcd.enonic.datatoolbox.RcdSnapshotScriptBean');
    const snapshotNames = JSON.parse(req.body).snapshotNames;

    const taskId = taskLib.submit({
        description: 'Snapshot deletion',
        task: function () {
            taskLib.progress({info: 'Deleting snapshots...'});
            taskLib.progress({info: bean.delete(snapshotNames)});
        }
    });

    return {
        contentType: 'application/json',
        body: {taskId: taskId}
    }
};