exports.post = function (req) {
    var body = JSON.parse(req.body);
    var repositoryName = body.repositoryName;
    var branchName = body.branchName;
    var path = body.path;
    var parentPath = body.parentPath;
    var properties = body.properties;
    var bean = __.newBean('systems.rcd.enonic.datatoolbox.RcdPropertyScriptBean');

    return {
        contentType: 'application/json',
        body: bean.delete(repositoryName, branchName, path, parentPath || null, properties)
    }
};
