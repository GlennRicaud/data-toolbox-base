exports.post = function (req) {
    const body = JSON.parse(req.body);
    const repositoryName = body.repositoryName;
    const branchName = body.branchName;
    const path = body.path;
    const parentPath = body.parentPath;
    const properties = body.properties;
    const bean = __.newBean('systems.rcd.enonic.datatoolbox.RcdPropertyScriptBean');

    return {
        contentType: 'application/json',
        body: bean.delete(repositoryName, branchName, path, parentPath || null, properties)
    }
};
