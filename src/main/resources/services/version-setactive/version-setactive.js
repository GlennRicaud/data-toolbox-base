exports.post = function (req) {
    const bean = __.newBean('systems.rcd.enonic.datatoolbox.RcdVersionScriptBean');
    const body = JSON.parse(req.body);

    const repositoryName = body.repositoryName;
    const branchName = body.branchName;
    const nodeId = body.nodeId;
    const nodeVersionId = body.nodeVersionId;
    const result = bean.setActive(repositoryName, branchName, nodeId, nodeVersionId);

    return {
        contentType: 'application/json',
        body: result
    }
};