exports.post = function (req) {
    const body = JSON.parse(req.body);
    const start = body.start || 0;
    const count = body.count || 50;

    const bean = __.newBean('systems.rcd.enonic.datatoolbox.RcdAuditScriptBean');

    return {
        contentType: 'application/json',
        body: bean.query(start, count)
    }
};