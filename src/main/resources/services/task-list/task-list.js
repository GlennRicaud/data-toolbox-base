const taskLib = require('/lib/xp/task');

exports.get = function () {
    const tasks = taskLib.list();
    return {
        contentType: 'application/json',
        body: {
            success: tasks
        }
    };
};