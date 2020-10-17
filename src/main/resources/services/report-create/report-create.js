const nodeLib = require('/lib/xp/node');
const taskLib = require('/lib/xp/task');
const queryLib = require('/lib/query');

exports.post = function (req) {
    const bean = __.newBean('systems.rcd.enonic.datatoolbox.RcdReportScriptBean');
    const body = JSON.parse(req.body);
    const repositoryName = body.repositoryName;
    const branchName = body.branchName;
    const query = body.query;
    const sort = body.sort ? decodeURIComponent(body.sort) : undefined;
    const reportName = body.reportName;

    const taskId = taskLib.submit({
        description: 'Report generation',
        task: function () {
            taskLib.progress({info: 'Querying...'});
            const queryResult = executeQuery(repositoryName, branchName, query, sort);
            taskLib.progress({
                info: 'Generating report (0/' + queryResult.total + ')...',
                current: 0,
                total: queryResult.total
            });
            const createReportFileCallback = __.toScriptValue(
                (createEntryConsumer) => {
                    generateReportEntries(repositoryName, branchName, queryResult, createEntryConsumer);
                    generateReportMeta({
                            repository: repositoryName || undefined,
                            branch: branchName || undefined,
                            query: query,
                            sort: sort,
                        },
                        {
                            total: queryResult.total
                        },
                        createEntryConsumer
                    );
                });

            const result = bean.createReportFile(reportName, createReportFileCallback);
            taskLib.progress({
                info: result,
                current: queryResult.total,
                total: queryResult.total
            });

        }
    });

    return {
        contentType: 'application/json',
        body: {taskId: taskId}
    }
};

function executeQuery(repositoryName, branchName, query, sort) {
    const repoConnection = queryLib.createRepoConnection(repositoryName, branchName);
    return repoConnection.query({
        query: query,
        start: 0,
        count: -1,
        sort: sort
    });
}

function generateReportEntries(repositoryName, branchName, queryResult, createEntryConsumer) {
    const repoConnection = queryLib.createRepoConnection(repositoryName, branchName);

    let current = 0;
    const total = queryResult.total;

    queryResult.hits.forEach(hit => {
        const node = (repositoryName && branchName) ? repoConnection.get(hit.id) : nodeLib.connect({
            repoId: hit.repoId,
            branch: hit.branch
        }).get(hit.id);
        createEntryConsumer((repositoryName || hit.repoId) + '/' + (branchName || hit.branch) + node._path + '.json',
            JSON.stringify(node, null, 2));

        current++;
        if (current % 10 === 0) {
            taskLib.progress({
                info: 'Generating report (' + current + '/' + total + ')...',
                current: current,
                total: total
            });
        }
    });
}

function generateReportMeta(queryParams, queryResult, createEntryConsumer) {
    createEntryConsumer('report.json', JSON.stringify({
        version: "1",
        format: 'Node as JSON',
        params: queryParams,
        result: queryResult
    }, null, 2));
}
