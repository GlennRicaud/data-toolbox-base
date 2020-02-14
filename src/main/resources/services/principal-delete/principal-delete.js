const authLib = require('/lib/xp/auth');
const taskLib = require('/lib/xp/task');

exports.post = function (req) {
    const body = JSON.parse(req.body);
    const type = body.type;
    const keys = body.keys;

    const taskId = taskLib.submit({
        description: 'Principal deletion',
        task: function () {
            taskLib.progress({
                info: 'Deleting ' + type + 's...',
                current: 0,
                total: keys.length
            });
            const result = runSafely(deletePrincipals, [keys, type])
            taskLib.progress({info: JSON.stringify(result)});
        }
    });

    return {
        contentType: 'application/json',
        body: {taskId: taskId}
    };
};

function deletePrincipals(keys, type) {

    let keyHandledCount = 0;
    let principalDeletedCount = 0;
    for (const key of keys) {
        if (authLib.deletePrincipal(key)) {
            principalDeletedCount++;
        }
        taskLib.progress({
            current: ++keyHandledCount,
            total: keys.length
        });
    }

    return {
        success: principalDeletedCount
    };
}

function runSafely(runnable, parameters) {
    try {
        return runnable.apply(null, parameters);
    } catch (e) {
        return {
            error: 'Error while deleting principals: ' + e.message
        }
    }
}