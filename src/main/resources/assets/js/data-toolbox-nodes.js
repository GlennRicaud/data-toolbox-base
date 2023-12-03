class NodesRoute extends DtbRoute {
    constructor() {
        super({
            state: 'nodes'
        });
    }

    onDisplay() {
        this.refreshBreadcrumbs();
        this.refreshTable();
        this.retrieveNodes();
    }

    createLayout() {
        this.createChildIconArea = new RcdGoogleMaterialIconArea('add_circle', () => this.createChildNode()).init().setTooltip(
            'Create child node');
        this.exportIconArea = new RcdImageIconArea(config.assetsUrl + '/icons/export-icon.svg', () => this.exportNode()).init().setTooltip(
            'Export selected node');
        this.importIconArea = new RcdImageIconArea(config.assetsUrl + '/icons/import-icon.svg', () => this.importNode()).init().setTooltip(
            'Import node export');
        this.moveIconArea = new RcdImageIconArea(config.assetsUrl + '/icons/rename.svg', () => this.moveNode()).init().setTooltip(
            'Move/rename node');
        this.fieldsIconArea = new RcdGoogleMaterialIconArea('view_column', () => this.setDisplayedFields()).init().setTooltip(
            'Set displayed fields');
        this.filterIconArea = new RcdGoogleMaterialIconArea('filter_list', () => this.filterNodes()).init().setTooltip('Filter nodes');
        this.sortIconArea = new RcdGoogleMaterialIconArea('sort', () => this.sortNodes()).init().setTooltip('Sort nodes');
        this.deleteIconArea = new RcdGoogleMaterialIconArea('delete', () => this.deleteNodes()).init().setTooltip('Delete selected nodes',
            RcdMaterialTooltipAlignment.RIGHT);
        return new RcdMaterialLayout().init();
    }

    refreshTable() {
        this.layout.removeChild(this.tableCard);
        this.tableCard = new RcdMaterialTableCard('Nodes').init();
        getFields().forEach((field, index) => {
            this.tableCard.addColumn(this.getFieldDisplayName(field), index === 0 ? {} : {classes: ['non-mobile-cell']})
        });
        this.tableCard.addColumn('', {icon: true})
            .addColumn('', {icon: true})
            .addIconArea(this.createChildIconArea, {max: 0, predicate: () => !!getPathParameter()})
            .addIconArea(this.exportIconArea, {min: 1, max: 1})
            .addIconArea(this.importIconArea, {max: 0})
            .addIconArea(this.moveIconArea, {min: 1})
            .addIconArea(this.fieldsIconArea, {max: 0})
            .addIconArea(this.filterIconArea, {max: 0})
            .addIconArea(this.sortIconArea, {max: 0})
            .addIconArea(this.deleteIconArea, {min: 1});
        this.layout.addChild(this.tableCard);
    }

    getFieldDisplayName(field) {
        switch (field) {
        case '_id':
            return 'Node ID';
        case '_name':
            return 'Node name';
        default:
            return field;
        }
    }

    getFieldValue(node, field) {
        const separatorIndex = field.indexOf('.');
        if (separatorIndex !== -1) {
            return this.getFieldValue(node[field.substring(0, separatorIndex)], field.substring(separatorIndex + 1))
        }
        const value = node[field];
        if (value !== null && typeof value === 'object') {
            return JSON.stringify(node[field]);
        }
        return node[field];
    }

    retrieveNodes() {
        const infoDialog = showShortInfoDialog('Retrieving node list...');
        this.tableCard.deleteRows();
        const parentStateRef = getPathParameter() ?
            buildStateRef('nodes', {
                repo: getRepoParameter(),
                branch: getBranchParameter(),
                path: getPathParameter() === '/' ? null : this.getParentPath(),
                fields: getFieldsParameter()
            }) : buildStateRef('branches', {
                repo: getRepoParameter()
            });
        const row = this.tableCard.createRow({selectable: false})
            .addCell('..', {href: parentStateRef});
        getFields().slice(1).forEach(field => row.addCell('', {
            href: parentStateRef,
            reachable: false,
            classes: ['non-mobile-cell']
        }));
        row.addCell(null, {icon: true})
            .addCell(null, {icon: true})
            .addClass('rcd-clickable')
            .addClickListener(() => {

            });
        return requestPostJson(config.servicesUrl + '/node-getchildren', {
            data: {
                repositoryName: getRepoParameter(),
                branchName: getBranchParameter(),
                parentPath: getPathParameter(),
                start: getStartParameter(),
                count: getCountParameter(),
                fields: getFieldsParameter(),
                filter: getFilterParameter(),
                sort: getSortParameter()
            },
        })
            .then((result) => this.onNodesRetrieval(result))
            .catch(handleRequestError)
            .finally(() => infoDialog.close());
    }

    onNodesRetrieval(result) {
        result.success.hits.forEach((node) => {

            const displayInfoCallback = () => setState('node',
                {repo: getRepoParameter(), branch: getBranchParameter(), path: node._path});
            const displayJsonCallback = () => this.displayNodeAsJson(node._id);

            const displayNodeIconArea = new RcdGoogleMaterialIconArea('info', (source, event) => {
                displayInfoCallback();
                event.stopPropagation();
            }).init().setTooltip('Display info');
            const displayJsonIconArea = new RcdImageIconArea(config.assetsUrl + '/icons/json.svg', (source, event) => {
                displayJsonCallback();
                event.stopPropagation();
            }).init().setTooltip('Display as JSON');

            const stateRef = buildStateRef('nodes', {
                repo: getRepoParameter(),
                branch: getBranchParameter(),
                path: node._path,
                fields: getFieldsParameter()
            });

            const row = this.tableCard.createRow();
            getFields().forEach((field, index) => {

                row.addCell(this.getFieldValue(node, field),
                    index === 0 ? {href: stateRef} : {href: stateRef, classes: ['non-mobile-cell']});
            });
            row.addCell(displayNodeIconArea, {icon: true})
                .addCell(displayJsonIconArea, {icon: true})
                .setAttribute('id', node._id)
                .setAttribute('path', node._path)
                .setAttribute('name', node._name);
            row.checkbox.addClickListener((event) => event.stopPropagation());
        });

        const startInt = parseInt(getStartParameter());
        const countInt = parseInt(getCountParameter());
        const rowCountCallback = (rowCount) => setState('nodes', {
            repo: getRepoParameter(),
            branch: getBranchParameter(),
            path: getPathParameter(),
            start: getStartParameter(),
            count: rowCount,
            fields: getFieldsParameter(),
            filter: getFilterParameter(),
            sort: getSortParameter()
        });
        const previousCallback = () => setState('nodes', {
            repo: getRepoParameter(),
            branch: getBranchParameter(),
            path: getPathParameter(),
            start: Math.max(0, startInt - countInt),
            count: getCountParameter(),
            fields: getFieldsParameter(),
            filter: getFilterParameter(),
            sort: getSortParameter()
        });
        const nextCallback = () => setState('nodes', {
            repo: getRepoParameter(),
            branch: getBranchParameter(),
            path: getPathParameter(),
            start: startInt + countInt,
            count: getCountParameter(),
            fields: getFieldsParameter(),
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

    createChildNode() {
        new CreateChildNodeDialog({
            parentPath: getPathParameter(),
            callback: () => this.retrieveNodes()
        }).init().open();
    }

    deleteNodes() {
        const nodeKeys = this.tableCard.getSelectedRows().map((row) => row.attributes['id']);
        return super.deleteNodes({nodeKeys: nodeKeys});
    }

    moveNode() {
        const sources = this.tableCard.getSelectedRows().map((row) => {
            return {
                id: row.attributes['id'],
                path: row.attributes['path']
            };
        });
        return super.moveNode(sources);
    }

    setDisplayedFields() {
        showInputDialog({
            title: "Set displayed fields",
            confirmationLabel: "SET",
            label: "Fields (comma separated)",
            placeholder: '',
            value: decodeURIComponent(getFieldsParameter()),
            callback: (value) => setState('nodes', {
                repo: getRepoParameter(),
                branch: getBranchParameter(),
                path: getPathParameter(),
                start: 0,
                count: getCountParameter(),
                fields: encodeURIComponent(value),
                filter: getFilterParameter(),
                sort: getSortParameter()
            })
        });
    }

    filterNodes() {
        showInputDialog({
            title: "Filter nodes",
            confirmationLabel: "FILTER",
            label: "Query expression",
            placeholder: '',
            value: decodeURIComponent(getFilterParameter()),
            callback: (value) => setState('nodes', {
                repo: getRepoParameter(),
                branch: getBranchParameter(),
                path: getPathParameter(),
                start: 0,
                count: getCountParameter(),
                fields: getFieldsParameter(),
                filter: encodeURIComponent(value),
                sort: getSortParameter()
            })
        });
    }

    sortNodes() {
        showInputDialog({
            title: "Sort nodes",
            confirmationLabel: "SORT",
            label: "Sort expression",
            placeholder: '',
            value: decodeURIComponent(getSortParameter()),
            callback: (value) => setState('nodes', {
                repo: getRepoParameter(),
                branch: getBranchParameter(),
                path: getPathParameter(),
                start: 0,
                count: getCountParameter(),
                fields: getFieldsParameter(),
                filter: getFilterParameter(),
                sort: encodeURIComponent(value)
            })
        });
    }

    exportNode() {
        const nodePath = this.tableCard.getSelectedRows().map((row) => row.attributes['path'])[0];
        const baseExportName = getPathParameter()
            ? (this.tableCard.getSelectedRows().map((row) => row.attributes['name'])[0] || 'export') + '-' +
            getBranchParameter()
            : getRepoParameter() + '-' + getBranchParameter();
        const defaultExportName = baseExportName + '-' + toLocalDateTimeFormat(new Date(), '-', '-');

        const infoDialog = showShortInfoDialog('Retrieving home information...');
        return requestJson(config.servicesUrl + '/home')
            .then((result) => {
                new DtbExportInputDialog({
                    type: 'node',
                    defaultValue: defaultExportName,
                    dirInfo: result.success.export,
                    callback: (value) => this.doExportNode(nodePath, value || defaultExportName)
                }).init().open();

            })
            .catch(handleRequestError)
            .finally(() => infoDialog.close());
    }

    importNode() {
        const infoDialog = showShortInfoDialog("Retrieving node export list...");
        return requestJson(config.servicesUrl + '/export-list')
            .then((result) => {
                const exportNames = result.success.sort((export1, export2) => export2.timestamp - export1.timestamp).map(
                    (anExport) => anExport.name);
                this.selectNodeExport(exportNames);
            })
            .catch(handleRequestError)
            .finally(() => infoDialog.close());
    }

    selectNodeExport(exportNames) {
        showSelectionDialog({
            title: "Select node export",
            confirmationLabel: "IMPORT",
            label: "Export name",
            options: exportNames,
            callback: (exportName) => this.doImportNode(exportName)
        });
    }

    doImportNode(exportName) {
        const infoDialog = showLongInfoDialog("Importing nodes...");
        return requestPostJson(config.servicesUrl + '/node-import', {
            data: {
                repositoryName: getRepoParameter(),
                branchName: getBranchParameter(),
                nodePath: getPathParameter() || '/',
                exportName: exportName
            }
        })
            .then((result) => handleTaskCreation(result, {
                taskId: result.taskId,
                message: 'Importing nodes...',
                doneCallback: (success) => new ImportResultDialog([exportName], success).init().open(),
                alwaysCallback: () => RcdHistoryRouter.refresh()
            }))
            .catch(handleRequestError)
            .finally(() => infoDialog.close());
    }

    refreshBreadcrumbs() {
        const repositoryName = getRepoParameter();
        const branchName = getBranchParameter();
        const path = getPathParameter();

        this.breadcrumbsLayout.setBreadcrumbs([new RcdMaterialBreadcrumb('Data Toolbox').init().setStateRef(''),
            new RcdMaterialBreadcrumb('Data Tree').init().setStateRef('repositories'),
            new RcdMaterialBreadcrumb(repositoryName).init().setStateRef('branches', {repo: repositoryName})]);

        const branchBreadcrumb = new RcdMaterialBreadcrumb(branchName).init();
        if (path) {
            branchBreadcrumb.setStateRef('nodes', {repo: repositoryName, branch: branchName});
        }
        this.breadcrumbsLayout.addBreadcrumb(branchBreadcrumb);

        if (path) {

            const rootBreadcrumb = new RcdMaterialBreadcrumb('root').init();
            if (path !== '/') {
                rootBreadcrumb.setStateRef('nodes', {repo: repositoryName, branch: branchName, path: '/'});
            }
            this.breadcrumbsLayout.addBreadcrumb(rootBreadcrumb);

            if (path === '/') {
                app.setTitle('Root node');
            } else {
                const pathElements = path.substring(1).split('/')
                app.setTitle(pathElements[pathElements.length - 1]);

                let currentPath = '';
                pathElements.forEach((subPathElement, index, array) => {
                    currentPath += '/' + subPathElement;
                    const constCurrentPath = currentPath;

                    const currentPathBreadcrumb = new RcdMaterialBreadcrumb(subPathElement).init();
                    if (index < array.length - 1) {
                        currentPathBreadcrumb.setStateRef('nodes', {
                            repo: repositoryName,
                            branch: branchName,
                            path: constCurrentPath
                        });
                    }
                    this.breadcrumbsLayout.addBreadcrumb(currentPathBreadcrumb);
                });
            }
        } else {
            app.setTitle(branchName);
        }
    }

    displayHelp() {
        const definition = 'A Node represents a single storable entity of data. ' +
            'It can be compared to a row in sql or a document in document oriented storage models.<br/>' +
            'See <a class="rcd-material-link" href="https://developer.enonic.com/docs/xp/stable/storage#nodes">Nodes</a> for more information. ';

        const structureDefinition = 'This view represents nodes in a tree structure. ' +
            'While this solution is adapted to repositories like com.enonic.cms.default or system-repo, ' +
            'it may not be suitable for custom repositories or for nodes with too many children. ' +
            'In these cases, we recommend to use the <a class="rcd-material-link" href="#search">Node Search</a> or the admin tool ' +
            '<a class="rcd-material-link" href="https://market.enonic.com/vendors/runar-myklebust/repoxplorer">repoXPlorer</a>.';

        const viewDefinition = 'The view lists in a table all the direct children nodes of the current node (or the root node for a branch). Click on a row to display its children.';
        new HelpDialog('Node Tree', [definition, structureDefinition, viewDefinition]).init()
            .addActionDefinition({
                iconName: 'add_circle',
                definition: 'Create child node.'
            })
            .addActionDefinition({
                iconSrc: config.assetsUrl + '/icons/export-icon.svg',
                definition: 'Export the selected node into $XP_HOME/data/export/[export-name]. The display will switch to the Exports view.'
            })
            .addActionDefinition({
                iconSrc: config.assetsUrl + '/icons/import-icon.svg',
                definition: 'Import previously exported nodes as children under the current node (or as root node)'
            })
            .addActionDefinition({
                iconSrc: config.assetsUrl + '/icons/rename.svg',
                definition: 'Move or rename node(s). If the value ends in slash \'/\', it specifies the parent path where to be moved. ' +
                    'Otherwise, it means the new desired path or name for the node (renaming available only if one node is selected).'
            })
            .addActionDefinition({
                iconName: 'view_column', definition: 'Set the displayed fields in the Nodes table. ' +
                    'Example: "_id,_ts,_name,_indexConfig.default.enabled"'
            })
            .addActionDefinition({
                iconName: 'filter_list', definition: 'Filter the nodes based on a query expression. ' +
                    'Example: "_id = \'role:system.admin"\'. ' +
                    'See <a class="rcd-material-link" href="https://developer.enonic.com/docs/xp/stable/storage/noql">Node Query language</a> for more information.'
            })
            .addActionDefinition({
                iconName: 'sort',
                definition: 'Sort the nodes based on an expression. ' +
                    'The sorting expression is composed of a node property to sort on and the direction: ascending or descending.' +
                    'Examples: "_ts DESC", "_name ASC"'
            })
            .addActionDefinition({iconName: 'delete', definition: 'Delete the selected nodes.'})
            .addActionDefinition({
                iconName: 'info',
                definition: 'Display the node view containing more details and actions about this node.'
            }).addActionDefinition({
            iconSrc: config.assetsUrl + '/icons/json.svg',
            definition: 'Display the node as JSON.'
        }).open();
    }
}
