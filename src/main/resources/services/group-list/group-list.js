exports.post = function (req) {
    const body = JSON.parse(req.body);
    const idProviderKey = body.idProviderKey;

    const bean = __.newBean('systems.rcd.enonic.datatoolbox.RcdSecurityScriptBean');

    return {
        contentType: 'application/json',
        body: bean.listGroups(idProviderKey, 0, 1024)
    }
};