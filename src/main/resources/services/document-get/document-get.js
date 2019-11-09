exports.post = function (req) {
    const bean = __.newBean('systems.rcd.enonic.datatoolbox.RcdIndexDocumentScriptBean');
    const body = JSON.parse(req.body);

    const repositoryName = body.repositoryName;
    const branchName = body.branchName;
    const type = body.type;
    const id = body.id;
    const versionKey = body.versionKey;

    const result = bean.get(repositoryName, branchName, type, id, versionKey);

    return {
        contentType: 'application/json',
        body: result
    }
};