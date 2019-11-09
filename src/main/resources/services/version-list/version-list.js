exports.post = function (req) {
    const bean = __.newBean('systems.rcd.enonic.datatoolbox.RcdVersionScriptBean');
    const body = JSON.parse(req.body);

    const repositoryName = body.repositoryName;
    const id = body.id;
    const start = body.start;
    const count = body.count;
    const result = bean.list(repositoryName, id, start, count);

    return {
        contentType: 'application/json',
        body: result
    }
};