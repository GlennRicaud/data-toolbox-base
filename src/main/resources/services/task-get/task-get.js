const taskLib = require('/lib/xp/task');

exports.post = function (req) {
    const taskId = JSON.parse(req.body).taskId;
    const task = taskLib.get(taskId);
    return {
        contentType: 'application/json',
        body: {
            success: task && {
                state: task.state,
                progress: task.progress
            }
        }
    };
};