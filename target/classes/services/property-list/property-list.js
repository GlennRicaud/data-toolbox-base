exports.post = function (req) {
    var body = JSON.parse(req.body);
    var repositoryName = body.repositoryName;
    var branchName = body.branchName;
    var path = body.path;
    var property = body.property;
    var start = body.start || 0;
    var count = body.count || 50;

    var bean = __.newBean('systems.rcd.enonic.datatoolbox.RcdPropertyScriptBean');

    return {
        contentType: 'application/json',
        body: bean.list(repositoryName, branchName, path, property || null, start, count)
    }
};