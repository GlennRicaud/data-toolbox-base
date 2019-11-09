exports.post = function (req) {
    var bean = __.newBean('systems.rcd.enonic.datatoolbox.RcdSnapshotScriptBean');
    var body = JSON.parse(req.body);
    var snapshotName = body.snapshotName;

    return {
        contentType: 'application/json',
        body: bean.load(snapshotName)
    }
};