exports.post = function (req) {
    const body = JSON.parse(req.body);
    const repositoryName = body.repositoryName;
    const branchName = body.branchName;
    const path = body.path;
    const parentPath = body.parentPath;
    const properties = body.properties;
    const bean = __.newBean('systems.rcd.enonic.datatoolbox.RcdPropertyScriptBean');

    const propertyMap = {};
    const ArrayList = Java.type('java.util.ArrayList');
    for (const name in properties) {
        const indexes = new ArrayList();
        properties[name].forEach(function (index) {
            indexes.add(index);
        });
        propertyMap[name] = indexes;
    }

    return {
        contentType: 'application/json',
        body: bean.delete(repositoryName, branchName, path, parentPath || null, propertyMap)
    }
};
