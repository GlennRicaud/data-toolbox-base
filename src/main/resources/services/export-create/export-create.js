var taskLib = require('/lib/xp/task');

exports.post = function (req) {
    var bean = __.newBean('systems.rcd.enonic.datatoolbox.RcdExportScriptBean');
    var body = JSON.parse(req.body);
    var cmsRepositoryShortName = body.cmsRepositoryShortName;
    var branchName = body.branchName;
    var contentPath = body.contentPath;
    var exportName = body.exportName;

    var taskId = taskLib.submit({
        description: 'Content export',
        task: function () {
            taskLib.progress({info: 'Exporting contents...'});
            taskLib.progress({info: bean.create('com.enonic.cms.' + cmsRepositoryShortName, branchName, '/content' + contentPath, exportName)});
        }
    });

    return {
        contentType: 'application/json',
        body: {taskId: taskId}
    }
};