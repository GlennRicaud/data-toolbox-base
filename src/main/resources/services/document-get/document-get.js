exports.post = function (req) {
    var bean = __.newBean('systems.rcd.enonic.datatoolbox.RcdIndexDocumentScriptBean');
    var body = JSON.parse(req.body);

    var repositoryName = body.repositoryName;
    var branchName = body.branchName;
    var type = body.type;
    var id = body.id;
    var versionKey = body.versionKey;

    var result = bean.get(repositoryName, branchName, type, id, versionKey);

    return {
        contentType: 'application/json',
        body: result
    }
};