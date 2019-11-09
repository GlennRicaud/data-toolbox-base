exports.post = function (req) {
    const body = JSON.parse(req.body);
    const repositoryName = body.repositoryName;
    const branchName = body.branchName;
    const path = body.path;
    const property = body.property;
    const type = body.type;
    const value = body.value;
    const bean = __.newBean('systems.rcd.enonic.datatoolbox.RcdPropertyScriptBean');

    return {
        contentType: 'application/json',
        body: bean.update(repositoryName, branchName, path, property, type, value)
    }
};