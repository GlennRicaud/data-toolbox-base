const taskLib = require('/lib/xp/task');

exports.post = function (req) {
    const bean = __.newBean('systems.rcd.enonic.datatoolbox.RcdDumpScriptBean');
    const dumpName = JSON.parse(req.body).dumpName;

    const taskId = taskLib.executeFunction({
        description: 'Dump upgrade',
        func: function () {
            taskLib.progress({info: 'Upgrading dump...'});
            taskLib.progress({info: bean.upgrade(dumpName)});
        }
    });

    return {
        contentType: 'application/json',
        body: {taskId: taskId}
    }
};