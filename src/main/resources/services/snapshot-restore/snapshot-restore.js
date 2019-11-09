exports.post = function (req) {
    const bean = __.newBean('systems.rcd.enonic.datatoolbox.RcdSnapshotScriptBean');
    const body = JSON.parse(req.body);
    const snapshotName = body.snapshotName;

    return {
        contentType: 'application/json',
        body: bean.load(snapshotName)
    }
};