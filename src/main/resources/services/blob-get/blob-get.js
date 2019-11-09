exports.post = function (req) {
    const blobBean = __.newBean('systems.rcd.enonic.datatoolbox.RcdBlobScriptBean');
    const body = JSON.parse(req.body);

    const repositoryName = body.repositoryName;
    const type = body.type;
    const blobKey = body.blobKey;

    const result = blobBean.get(repositoryName, type, blobKey);

    return {
        contentType: 'application/json',
        body: result
    }
};