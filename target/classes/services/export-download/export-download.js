var portalLib = require('/lib/xp/portal');

exports.post = function (req) {
    var bean = __.newBean('systems.rcd.enonic.datatoolbox.RcdExportScriptBean');
    var archiveName = req.params.archiveName;
    var fileName = req.params.fileName;

    return {
        contentType: 'application/octet-stream',
        body: bean.download(archiveName),
        headers: {
            "Content-Disposition": "attachment; filename=" + fileName
        }
    }
};