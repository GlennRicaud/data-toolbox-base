var taskLib = require('/lib/xp/task');

exports.post = function (req) {
    var taskId = JSON.parse(req.body).taskId;
    var task = taskLib.get(taskId);
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