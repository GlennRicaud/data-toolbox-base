exports.post = function (req) {
    var body = JSON.parse(req.body);
    var repositoryName = body.repositoryName;
    var branchName = body.branchName;
    var path = body.path;
    var parentPath = body.parentPath;
    var name = body.name;
    var type = body.type;
    var value = body.value;
    var bean = __.newBean('systems.rcd.enonic.datatoolbox.RcdPropertyScriptBean');

    return {
        contentType: 'application/json',
        body: bean.create(repositoryName, branchName, path, parentPath || null, name, type, value)
    }
};