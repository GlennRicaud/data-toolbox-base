var nodeLib = require('/lib/xp/node');

exports.post = function (req) {
    var repositoryName = req.params.repositoryName;
    var branchName = req.params.branchName;
    var key = req.params.key;
    var binaryReference = req.params.binaryReference;

    var binary = nodeLib.connect({
        repoId: repositoryName,
        branch: branchName
    }).getBinary({
        key: key,
        binaryReference: binaryReference
    });

    return {
        contentType: 'application/octet-stream',
        body: binary,
        headers: {
            "Content-Disposition": "attachment; filename=" + binaryReference
        }
    }
};