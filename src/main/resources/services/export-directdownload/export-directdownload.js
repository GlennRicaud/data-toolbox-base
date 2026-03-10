const portalLib = require('/lib/xp/portal');

exports.post = function (req) {
    const bean = __.newBean('systems.rcd.enonic.datatoolbox.RcdExportScriptBean');
    const archiveName = req.params.archiveName;
    const fileName = req.params.fileName;

    return {
        contentType: 'application/octet-stream',
        body: bean.directDownload(archiveName),
        headers: {
            "Content-Disposition": "attachment; filename=" + fileName
        }
    }
};