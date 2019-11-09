const nodeLib = require('/lib/xp/node');

exports.post = (req) => {
    const repositoryName = req.params.repositoryName;
    const branchName = req.params.branchName;
    const key = req.params.key;
    const binaryReference = req.params.binaryReference;

    const binary = nodeLib.connect({
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