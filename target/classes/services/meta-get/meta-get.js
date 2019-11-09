var nodeLib = require('/lib/xp/node');
var exceptionLib = require('/lib/exception');

exports.post = function (req) {
    var body = JSON.parse(req.body);
    var repositoryName = body.repositoryName;
    var branchName = body.branchName;
    var key = body.key;

    var result = exceptionLib.runSafely(getMeta, [repositoryName, branchName, key], 'Error while retrieving metadata');
    return {
        contentType: 'application/json',
        body: result
    };
};

function getMeta(repositoryName, branchName, key) {
    var repoConnection = nodeLib.connect({
        repoId: repositoryName,
        branch: branchName
    });

    var result = repoConnection.get(key);

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