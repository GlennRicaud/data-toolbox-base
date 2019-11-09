exports.post = function (req) {
    const body = JSON.parse(req.body);
    const repositoryName = body.repositoryName;
    const branchName = body.branchName;
    const path = body.path;
    const parentPath = body.parentPath;
    const name = body.name;
    const type = body.type;
    const value = body.value;
    const bean = __.newBean('systems.rcd.enonic.datatoolbox.RcdPropertyScriptBean');

    return {
        contentType: 'application/json',
        body: bean.create(repositoryName, branchName, path, parentPath || null, name, type, value)
    }
};