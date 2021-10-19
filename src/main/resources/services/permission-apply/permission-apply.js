const taskLib = require('/lib/xp/task');

exports.post = function (req) {
    const bean = __.newBean('systems.rcd.enonic.datatoolbox.RcdPermissionScriptBean');
    const body = JSON.parse(req.body);
    const repositoryName = body.repositoryName;
    const branchName = body.branchName;
    const nodeId = body.nodeId;
    const inheritPermissions = body.inheritPermissions;
    const overwriteChildPermissions = body.overwriteChildPermissions;

    const taskId = taskLib.submit({
        description: 'Permissions application',
        task: function () {
            taskLib.progress({info: 'Applying permissions...'});
            taskLib.progress({info: bean.apply(repositoryName, branchName, nodeId, inheritPermissions, overwriteChildPermissions)});
        }
    });

    return {
        contentType: 'application/json',
        body: {taskId: taskId}
    }
};