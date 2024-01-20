const contentLib = require('/lib/xp/content');
const contextLib = require('/lib/xp/context');
const taskLib = require('/lib/xp/task');
const utilLib = require('/lib/util');

exports.post = function (req) {
    const body = JSON.parse(req.body);
    const projectId = body.projectId;
    const branchName = body.branchName || 'draft';
    const keys = body.keys;

    const taskId = taskLib.submit({
        description: 'Content deletion',
        task: function () {
            taskLib.progress({info: 'Deleting contents...', current: 0, total: keys.length});
            const result = utilLib.runSafely(deleteContents, [projectId, branchName, keys], 'Error while deleting contents')
            taskLib.progress({info: JSON.stringify(result)});
        }
    });

    return {
        contentType: 'application/json',
        body: {taskId: taskId}
    };
};

function deleteContents(projectId, branchName, keys) {
    contextLib.run({
        repository: 'com.enonic.cms.' + projectId,
        branch: branchName
    }, function () {
        for (let i = 0; i < keys.length; i++) {
            for (const key of keys) {
                contentLib.delete({
                    key: keys[i],
                });
                taskLib.progress({
                    info: 'Deleting contents...',
                    current: i,
                    total: keys.length
                })
            }
        }
    })
    return {
        success: true
    };
}