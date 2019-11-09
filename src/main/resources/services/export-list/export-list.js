exports.get = function () {
    const bean = __.newBean('systems.rcd.enonic.datatoolbox.RcdExportScriptBean');

    return {
        contentType: 'application/json',
        body: bean.list()
    }
};