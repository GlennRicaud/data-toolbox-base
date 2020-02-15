const nodeLib = require('/lib/xp/node');
const utilLib = require('/lib/util');

exports.post = function (req) {
    const body = JSON.parse(req.body);
    const repositoryName = body.repositoryName;
    const branchName = body.branchName;
    const key = body.key;

    const result = utilLib.runSafely(getMeta, [repositoryName, branchName, key], 'Error while retrieving metadata');
    return {
        contentType: 'application/json',
        body: result
    };
};

function getMeta(repositoryName, branchName, key) {
    const repoConnection = nodeLib.connect({
        repoId: repositoryName,
        branch: branchName
    });

    const result = repoConnection.get(key);

    return {
        success: {
            _id: result._id,
            _name: result._name,
            _path: result._path,
            _parentPath: result._parentPath,
            _childOrder: result._childOrder,
            _state: result._state,
            _nodeType: result._nodeType,
            _versionKey: result._versionKey,
            _manualOrderValue: result._manualOrderValue,
            _ts: result._ts
        }
    };
}