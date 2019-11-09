var taskLib = require('/lib/xp/task');

exports.post = function (req) {
    var bean = __.newBean('systems.rcd.enonic.datatoolbox.RcdDumpScriptBean');
    var body = JSON.parse(req.body);
    var dumpName = body.dumpName;

    var taskId = taskLib.submit({
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