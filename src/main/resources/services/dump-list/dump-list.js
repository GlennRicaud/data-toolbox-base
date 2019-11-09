exports.get = function () {
    const bean = __.newBean('systems.rcd.enonic.datatoolbox.RcdDumpScriptBean');

    return {
        contentType: 'application/json',
        body: bean.list()
    }
};