const taskLib = require('/lib/xp/task');
const portalLib = require('/lib/xp/portal');

exports.post = function (req) {
    const bean = __.newBean('systems.rcd.enonic.datatoolbox.RcdDumpScriptBean');
    const fileName = portalLib.getMultipartItem("uploadFile", 0).fileName;
    const uploadFileStream = portalLib.getMultipartStream("uploadFile", 0);
    
    const archivePath = bean.upload(fileName, uploadFileStream);

    const taskId = taskLib.submit({
        description: 'Dumps unarchiving',
        task: function () {
            taskLib.progress({info: 'Unarchiving dumps...'});
            const listener = __.toScriptValue(
                (count) => {
                    if (count > 0) {
                        taskLib.progress({info: 'Unarchiving dumps... (' + count + ' files unarchived)'});
                    }
                });
            taskLib.progress({info: bean.unarchive(archivePath, listener)});
        }
    });

    return {
        contentType: 'application/json',
        body: {taskId: taskId}
    }
};