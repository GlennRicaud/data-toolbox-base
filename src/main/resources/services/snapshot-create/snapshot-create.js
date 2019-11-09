const taskLib = require('/lib/xp/task');

exports.post = function (req) {
    const bean = __.newBean('systems.rcd.enonic.datatoolbox.RcdSnapshotScriptBean');
    const body = JSON.parse(req.body);
    const snapshotName = body.snapshotName;

    const taskId = taskLib.submit({
        description: 'Snapshot creation',
        task: function () {
            taskLib.progress({info: 'Creating snapshot...'});
            taskLib.progress({info: bean.create(snapshotName)});
        }
    });

    return {
        contentType: 'application/json',
        body: {taskId: taskId}
    }
};