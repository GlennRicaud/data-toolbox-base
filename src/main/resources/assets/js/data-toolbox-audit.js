class AuditRoute extends DtbRoute {
    constructor() {
        super({
            state: 'audit',
            name: 'Audit Log',
            iconArea: new RcdGoogleMaterialIconArea('find_in_page').init()
        });
    }

    onDisplay() {
        app.setTitle('Audit Log');
        this.retrieveAuditLog();
    }

    createBreadcrumbsLayout() {
        return new RcdMaterialBreadcrumbsLayout().init()
            .addBreadcrumb(new RcdMaterialBreadcrumb('Data Toolbox').init().setStateRef(''))
            .addBreadcrumb(new RcdMaterialBreadcrumb('Audit Log').init())
            .addChild(new RcdGoogleMaterialIconArea('help', () => this.displayHelp()).init().setTooltip('Help'));
    }

    createLayout() {
        const filterIconArea = new RcdGoogleMaterialIconArea('filter_list', () => this.filterRecords())
            .init()
            .setTooltip('Filter records');
        const deleteIconArea = new RcdGoogleMaterialIconArea('delete', () => this.deleteRecords())
            .init()
            .setTooltip('Delete selected records', RcdMaterialTooltipAlignment.RIGHT);
        this.tableCard = new RcdMaterialTableCard('Audit Log')
            .init()
            .addColumn('Description')
            //.addIconArea(filterIconArea, {max: 0})
            .addIconArea(deleteIconArea, {min: 1});
        return new RcdMaterialLayout().init()
            .addChild(this.tableCard);
    }

    retrieveAuditLog() {
        const infoDialog = showShortInfoDialog('Retrieving audit log...');
        this.tableCard.deleteRows();
        return requestPostJson(config.servicesUrl + '/audit-query', {
            data: {
                start: getStartParameter(),
                count: getCountParameter(),
                filter: getFilterParameter(),
                sort: getSortParameter()
            }
        })
            .then((result) => this.onAuditLogRetrieval(result))
            .catch(handleRequestError)
            .finally(() => infoDialog.close());
    }

    onAuditLogRetrieval(result) {
        result.success.hits
            .forEach((record) => {
                this.tableCard.createRow()
                    .addCell(
                        record.user + ' <b>' + record.action + '</b> ' + record.target + '<br/><a class="">' +
                        new Date(record.time).toISOString() +
                        '</a>')
                    .setAttribute('id', record.id);
            });

        const startInt = parseInt(getStartParameter());
        const countInt = parseInt(getCountParameter());
        const rowCountCallback = (rowCount) => setState('audit', {
            start: getStartParameter(),
            count: rowCount,
            filter: getFilterParameter(),
            sort: getSortParameter()
        });
        const previousCallback = () => setState('audit', {
            start: Math.max(0, startInt - countInt),
            count: getCountParameter(),
            filter: getFilterParameter(),
            sort: getSortParameter()
        });
        const nextCallback = () => setState('audit', {
            start: startInt + countInt,
            count: getCountParameter(),
            filter: getFilterParameter(),
            sort: getSortParameter()
        });
        this.tableCard.setFooter({
            rowCount: parseInt(getCountParameter()),
            start: parseInt(getStartParameter()),
            count: result.success.hits.length,
            total: result.success.total,
            rowCountCallback: rowCountCallback,
            previousCallback: previousCallback,
            nextCallback: nextCallback
        });
    }

    deleteRecords() {
        const keys = this.tableCard.getSelectedRows()
            .map((row) => row.attributes['id']);
        return super.deleteNodes({
            repo: 'system.auditlog',
            branch: 'master',
            nodeKeys: keys
        });
    }

    displayHelp() {
        const definition = 'Any application can store audit log records.';

        const viewDefinition = 'The view lists in a table all the audit log records with special treatment for Content API records. Contact me to include your audit log format.';
        new HelpDialog('Audit Log', [definition, viewDefinition]).init()
            .addActionDefinition({iconName: 'delete', definition: 'Delete the selected records.'})
            .open();
    }

}
