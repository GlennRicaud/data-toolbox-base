const taskLib = require('/lib/xp/task');

exports.post = function (req) {
    const bean = __.newBean('systems.rcd.enonic.datatoolbox.RcdDumpScriptBean');
    const body = JSON.parse(req.body);
    const dumpName = body.dumpName;
    const includeVersions = body.includeVersions;
    const maxVersions = body.maxVersions;
    const maxVersionsAge = body.maxVersionsAge;

    const taskId = taskLib.submit({
        description: 'Dump creation',
        task: function () {
            taskLib.progress({info: 'Creating dump...'});
            taskLib.progress({info: bean.create(dumpName, includeVersions, maxVersions || null, maxVersionsAge || null)});
        }
    });

    return {
        contentType: 'application/json',
        body: {taskId: taskId}
    }
};