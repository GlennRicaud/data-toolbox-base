exports.post = function (req) {
    var bean = __.newBean('systems.rcd.enonic.datatoolbox.RcdVersionScriptBean');
    var body = JSON.parse(req.body);

    var repositoryName = body.repositoryName;
    var id = body.id;
    var start = body.start;
    var count = body.count;
    var result = bean.list(repositoryName, id, start, count);

    return {
        contentType: 'application/json',
        body: result
    }
};