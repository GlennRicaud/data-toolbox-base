exports.post = function (req) {
    const body = JSON.parse(req.body);
    const idProviderKey = body.idProviderKey;
    const start = body.start || 0;
    const count = body.count || 50;
    const filter = body.filter ? decodeURIComponent(body.filter) : null;
    const sort = body.sort ? decodeURIComponent(body.sort) : null;

    const bean = __.newBean('systems.rcd.enonic.datatoolbox.RcdSecurityScriptBean');

    return {
        contentType: 'application/json',
        body: bean.queryUsers(idProviderKey, start, count, filter, sort)
    }
};