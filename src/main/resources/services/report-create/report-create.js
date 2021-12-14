const nodeLib = require('/lib/xp/node');
const taskLib = require('/lib/xp/task');
const queryLib = require('/lib/query');

exports.post = function (req) {
    const bean = __.newBean('systems.rcd.enonic.datatoolbox.RcdReportScriptBean');
    const body = JSON.parse(req.body);
    const repositoryName = body.repositoryName;
    const branchName = body.branchName;
    const query = body.query;
    const filters = body.filters;
    const parsedFilters = filters ? JSON.parse(filters) : null;
    const sort = body.sort ? decodeURIComponent(body.sort) : undefined;
    const reportName = body.reportName;
    const format = body.format;
    const fields = body.fields;

    const taskId = taskLib.submit({
        description: 'Report generation',
        task: function () {
            taskLib.progress({info: 'Querying...'});
            const queryResult = executeQuery(repositoryName, branchName, query, parsedFilters, sort);
            taskLib.progress({
                info: 'Generating report (0/' + queryResult.total + ')...',
                current: 0,
                total: queryResult.total
            });
            const createReportFileCallback = __.toScriptValue(
                (createEntryConsumer, setNextEntryConsumer, writeEntryConsumer) => {
                    generateReportEntries(format, fields, repositoryName, branchName, queryResult, createEntryConsumer,
                        setNextEntryConsumer,
                        writeEntryConsumer);
                    generateReportMeta(
                        format,
                        {
                            repository: repositoryName || undefined,
                            branch: branchName || undefined,
                            query: query,
                            filters: parsedFilters || undefined,
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

function executeQuery(repositoryName, branchName, query, filters, sort) {
    const repoConnection = queryLib.createRepoConnection(repositoryName, branchName);
    return repoConnection.query({
        query: query,
        filters: filters,
        start: 0,
        count: -1,
        sort: sort
    });
}

function generateReportEntries(format, fields, repositoryName, branchName, queryResult, createEntryConsumer, setNextEntryConsumer,
                               writeEntryConsumer) {
    const repoConnection = queryLib.createRepoConnection(repositoryName, branchName);

    let current = 0;
    const total = queryResult.total;

    const fieldArray = fields.split(',')
        .map(fieldName => fieldName.trim())
        .filter(fieldName => fieldName !== '');
    if (format === 'Node fields as CSV') {
        setNextEntryConsumer('fields.json');
        writeEntryConsumer(fieldArray.join(','));
    }
    queryResult.hits.forEach(hit => {
        const node = (repositoryName && branchName) ? repoConnection.get(hit.id) : nodeLib.connect({
            repoId: hit.repoId,
            branch: hit.branch
        }).get(hit.id);

        if (format === 'Node as JSON tree') {
            createEntryConsumer((repositoryName || hit.repoId) + '/' + (branchName || hit.branch) + node._path + '.json',
                JSON.stringify(node, null, 2));
        } else if (format === 'Node fields as CSV') {
            const row = fieldArray.map((fieldName, index) => {
                const field = node[fieldName];
                return field == null ? 'null' : JSON.stringify(node[fieldName], null, 0);
            }).join(',');
            writeEntryConsumer('\n' + row);
        }

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

function generateReportMeta(format, queryParams, queryResult, createEntryConsumer) {
    createEntryConsumer('report.json', JSON.stringify({
        version: "1",
        format: format,
        params: queryParams,
        result: queryResult
    }, null, 2));
}
