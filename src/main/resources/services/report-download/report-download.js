exports.post = function (req) {
    const bean = __.newBean('systems.rcd.enonic.datatoolbox.RcdReportScriptBean');
    const archiveName = req.params.archiveName;
    const fileName = req.params.fileName;

    return {
        contentType: 'application/octet-stream',
        body: bean.download(archiveName),
        headers: {
            "Content-Disposition": "attachment; filename=" + fileName
        }
    }
};