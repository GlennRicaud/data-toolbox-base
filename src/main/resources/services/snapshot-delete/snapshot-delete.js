var taskLib = require('/lib/xp/task');

exports.post = function (req) {
    var bean = __.newBean('systems.rcd.enonic.datatoolbox.RcdSnapshotScriptBean');
    var snapshotNames = JSON.parse(req.body).snapshotNames;

    var taskId = taskLib.submit({
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