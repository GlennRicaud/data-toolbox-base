const taskLib = require('/lib/xp/task');

exports.post = function (req) {
    const bean = __.newBean('systems.rcd.enonic.datatoolbox.RcdExportScriptBean');
    const body = JSON.parse(req.body);
    const cmsRepositoryShortName = body.cmsRepositoryShortName;
    const branchName = body.branchName;
    const contentPath = body.contentPath;
    const exportName = body.exportName;

    const taskId = taskLib.executeFunction({
        description: 'Content export',
        func: function () {
            taskLib.progress({info: 'Exporting contents...'});
            taskLib.progress({info: bean.create('com.enonic.cms.' + cmsRepositoryShortName, branchName, '/content' + contentPath, exportName)});
        }
    });

    return {
        contentType: 'application/json',
        body: {taskId: taskId}
    }
};