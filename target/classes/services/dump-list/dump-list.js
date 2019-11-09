exports.get = function () {
    var bean = __.newBean('systems.rcd.enonic.datatoolbox.RcdDumpScriptBean');

    return {
        contentType: 'application/json',
        body: bean.list()
    }
};