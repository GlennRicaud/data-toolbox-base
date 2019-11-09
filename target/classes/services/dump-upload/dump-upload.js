var taskLib = require('/lib/xp/task');
var portalLib = require('/lib/xp/portal');

exports.post = function (req) {
    var bean = __.newBean('systems.rcd.enonic.datatoolbox.RcdDumpScriptBean');
    var fileName = portalLib.getMultipartItem("uploadFile", 0).fileName;
    var uploadFileStream = portalLib.getMultipartStream("uploadFile", 0);
    
    var archivePath = bean.upload(fileName, uploadFileStream);

    var taskId = taskLib.submit({
        description: 'Dumps unarchiving',
        task: function () {
            taskLib.progress({info: 'Unarchiving dumps...'});
            taskLib.progress({info: bean.unarchive(archivePath)});
        }
    });

    return {
        contentType: 'application/json',
        body: {taskId: taskId}
    }
};