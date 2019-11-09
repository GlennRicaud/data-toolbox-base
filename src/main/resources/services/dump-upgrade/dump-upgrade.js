const taskLib = require('/lib/xp/task');

exports.post = function (req) {
    const bean = __.newBean('systems.rcd.enonic.datatoolbox.RcdDumpScriptBean');
    const dumpName = JSON.parse(req.body).dumpName;

    const taskId = taskLib.submit({
        description: 'Dump upgrade',
        task: function () {
            taskLib.progress({info: 'Upgrading dump...'});
            taskLib.progress({info: bean.upgrade(dumpName)});
        }
    });

    return {
        contentType: 'application/json',
        body: {taskId: taskId}
    }
};