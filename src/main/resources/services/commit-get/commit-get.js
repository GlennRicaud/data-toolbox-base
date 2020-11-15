exports.post = function (req) {
    const bean = __.newBean('systems.rcd.enonic.datatoolbox.RcdCommitScriptBean');
    const body = JSON.parse(req.body);

    const repositoryName = body.repositoryName;
    const nodeCommitId = body.nodeCommitId;

    const result = bean.get(repositoryName, nodeCommitId);

    return {
        contentType: 'application/json',
        body: result
    }
};