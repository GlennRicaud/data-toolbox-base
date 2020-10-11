const portalLib = require('/lib/xp/portal');

exports.post = function (req) {
    const bean = __.newBean('systems.rcd.enonic.datatoolbox.RcdDumpScriptBean');
    const fileName = portalLib.getMultipartItem("uploadFile", 0).fileName;
    const uploadFileStream = portalLib.getMultipartStream("uploadFile", 0);
    return {
        contentType: 'application/json',
        body: bean.directUpload(fileName, uploadFileStream)
    }
};