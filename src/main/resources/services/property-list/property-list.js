exports.post = function (req) {
    const body = JSON.parse(req.body);
    const repositoryName = body.repositoryName;
    const branchName = body.branchName;
    const path = body.path;
    const property = body.property;
    const start = body.start || 0;
    const count = body.count || 50;

    const bean = __.newBean('systems.rcd.enonic.datatoolbox.RcdPropertyScriptBean');

    return {
        contentType: 'application/json',
        body: bean.list(repositoryName, branchName, path, property || null, start, count)
    }
};