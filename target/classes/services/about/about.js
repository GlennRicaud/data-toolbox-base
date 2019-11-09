exports.get = function () {
    var bean = __.newBean('systems.rcd.enonic.datatoolbox.RcdAboutScriptBean');

    return {
        contentType: 'application/json',
        body: bean.getAboutInfo()
    }
};