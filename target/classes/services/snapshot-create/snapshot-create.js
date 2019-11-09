var taskLib = require('/lib/xp/task');

exports.post = function (req) {
    var bean = __.newBean('systems.rcd.enonic.datatoolbox.RcdSnapshotScriptBean');
    var body = JSON.parse(req.body);
    var snapshotName = body.snapshotName;

    var taskId = taskLib.submit({
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