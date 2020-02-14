exports.post = function (req) {
    const body = JSON.parse(req.body);
    const idProviderKey = body.idProviderKey;
    const start = body.start || 0;
    const count = body.count || 50;

    const bean = __.newBean('systems.rcd.enonic.datatoolbox.RcdSecurityScriptBean');

    return {
        contentType: 'application/json',
        body: bean.listGroups(idProviderKey, start, count)
    }
};