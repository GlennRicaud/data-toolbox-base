const taskLib = require('/lib/xp/task');

exports.post = function (req) {
    const bean = __.newBean('systems.rcd.enonic.datatoolbox.RcdExportScriptBean');
    const body = JSON.parse(req.body);
    const cmsRepositoryShortName = body.cmsRepositoryShortName;
    const branchName = body.branchName;
    const contentPath = body.contentPath;
    const exportNames = body.exportNames;

    const taskId = taskLib.submit({
        description: 'Content import',
        task: function () {
            taskLib.progress({info: 'Importing contents...'});
            taskLib.progress({info: bean.load(exportNames, 'com.enonic.cms.' + cmsRepositoryShortName, branchName, '/content' + (contentPath == '/' ? '' : contentPath))});
        }
    });

    return {
        contentType: 'application/json',
        body: {taskId: taskId}
    }
};