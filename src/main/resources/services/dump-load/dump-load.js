const taskLib = require('/lib/xp/task');

exports.post = function (req) {
    const bean = __.newBean('systems.rcd.enonic.datatoolbox.RcdDumpScriptBean');
    const body = JSON.parse(req.body);
    const dumpName = body.dumpName;

    const taskId = taskLib.submit({
        description: 'Dump deletion',
        task: function () {
            taskLib.progress({info: 'Loading dump...'});
            taskLib.progress({info: bean.load(dumpName)});
        }
    });

    return {
        contentType: 'application/json',
        body: {taskId: taskId}
    }
};