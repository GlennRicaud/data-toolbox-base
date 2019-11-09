exports.post = function (req) {
    var blobBean = __.newBean('systems.rcd.enonic.datatoolbox.RcdBlobScriptBean');
    var body = JSON.parse(req.body);

    var repositoryName = body.repositoryName;
    var type = body.type;
    var blobKey = body.blobKey;

    var result = blobBean.get(repositoryName, type, blobKey);

    return {
        contentType: 'application/json',
        body: result
    }
};