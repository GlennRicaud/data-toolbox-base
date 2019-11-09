exports.get = function () {
    const bean = __.newBean('systems.rcd.enonic.datatoolbox.RcdSnapshotScriptBean');

    return {
        contentType: 'application/json',
        body: bean.list()
    }
};