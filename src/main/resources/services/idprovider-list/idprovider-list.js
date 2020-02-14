exports.get = function () {
    const bean = __.newBean('systems.rcd.enonic.datatoolbox.RcdSecurityScriptBean');

    return {
        contentType: 'application/json',
        body: bean.listIdProviders()
    }
};