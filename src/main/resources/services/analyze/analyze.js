exports.post = function (req) {
    const bean = __.newBean('systems.rcd.enonic.datatoolbox.RcdAnalyzeScriptBean');
    const body = JSON.parse(req.body);

    const repositoryName = body.repositoryName;
    const field = body.field;
    const analyzer = body.analyzer;
    const text = body.text;

    const result = bean.analyze(repositoryName, field, analyzer, text);

    return {
        contentType: 'application/json',
        body: result
    }
};