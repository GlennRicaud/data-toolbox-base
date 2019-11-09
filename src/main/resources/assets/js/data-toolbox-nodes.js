class NodesRoute extends DtbRoute {
    constructor() {
        super({
            state: 'nodes'
        });
    }

    onDisplay() {
        this.refreshBreadcrumbs();
        this.retrieveNodes();
    }

    createLayout() {
        const exportIconArea = new RcdImageIconArea(config.assetsUrl + '/icons/export-icon.svg', () => this.exportNode()).init().setTooltip(
            'Export selected node');
        const importIconArea = new RcdImageIconArea(config.assetsUrl + '/icons/import-icon.svg', () => this.importNode()).init().setTooltip(
            'Import node export');
        const moveIconArea = new RcdImageIconArea(config.assetsUrl + '/icons/rename.svg', () => this.moveNode()).init().setTooltip(
            'Move/rename node');
        const filterIconArea = new RcdGoogleMaterialIconArea('filter_list', () => this.filterNodes()).init().setTooltip('Filter nodes');
        const sortIconArea = new RcdGoogleMaterialIconArea('sort', () => this.sortNodes()).init().setTooltip('Sort nodes');
        const deleteIconArea = new RcdGoogleMaterialIconArea('delete', () => this.deleteNodes()).init().setTooltip('Delete selected nodes',
            RcdMaterialTooltipAlignment.RIGHT);
        this.tableCard =
            new RcdMaterialTableCard('Nodes').init().addColumn('Node name').addColumn('Node ID', {classes: ['non-mobile-cell']}).addColumn(
                '', {icon: true}).addColumn('', {icon: true}).addIconArea(exportIconArea, {min: 1, max: 1}).addIconArea(importIconArea,
                {max: 0}).addIconArea(moveIconArea, {min: 1}).addIconArea(filterIconArea, {max: 0}).addIconArea(sortIconArea,
                {max: 0}).addIconArea(deleteIconArea, {min: 1});

        return new RcdMaterialLayout().init().addChild(this.tableCard);
    }

    retrieveNodes() {
        const infoDialog = showShortInfoDialog('Retrieving node list...');
        this.tableCard.deleteRows();
        this.tableCard.createRow({selectable: false})
            .addCell('..')
            .addCell('', {classes: ['non-mobile-cell']})
            .addCell(null, {icon: true})
            .addCell(null, {icon: true})
            .addClass('rcd-clickable')
            .addClickListener(() => {
                if (getPathParameter()) {
                    setState('nodes', {
                        repo: getRepoParameter(),
                        branch: getBranchParameter(),
                        path: getPathParameter() === '/' ? null : this.getParentPath()
                    });
                } else {
                    setState('branches', {repo: getRepoParameter()});
                }
            });
        return requestPostJson(config.servicesUrl + '/node-getchildren', {
            data: {
                repositoryName: getRepoParameter(),
                branchName: getBranchParameter(),
                parentPath: getPathParameter(),
                start: getStartParameter(),
                count: getCountParameter(),
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

            const row = this.tableCard.createRow().addCell(node._name).addCell(node._id, {classes: ['non-mobile-cell']}).addCell(
                displayNodeIconArea, {icon: true}).addCell(displayJsonIconArea, {icon: true}).setAttribute('id', node._id).setAttribute(
                'path', node._path).setAttribute('name', node._name).addClass('rcd-clickable').addClickListener(
                () => setState('nodes', {repo: getRepoParameter(), branch: getBranchParameter(), path: node._path}));
            row.checkbox.addClickListener((event) => event.stopPropagation());
        });

        const startInt = parseInt(getStartParameter());
        const countInt = parseInt(getCountParameter());
        const previousCallback = () => setState('nodes', {
            repo: getRepoParameter(),
            branch: getBranchParameter(),
            path: getPathParameter(),
            start: Math.max(0, startInt - countInt),
            count: getCountParameter(),
            filter: getFilterParameter(),
            sort: getSortParameter()
        });
        const nextCallback = () => setState('nodes', {
            repo: getRepoParameter(),
            branch: getBranchParameter(),
            path: getPathParameter(),
            start: startInt + countInt,
            count: getCountParameter(),
            filter: getFilterParameter(),
            sort: getSortParameter()
        });
        this.tableCard.setFooter({
            start: parseInt(getStartParameter()),
            count: result.success.hits.length,
            total: result.success.total,
            previousCallback: previousCallback,
            nextCallback: nextCallback
        });
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
                filter: getFilterParameter(),
                sort: encodeURIComponent(value)
            })
        });
    }

    exportNode() {
        const nodePath = this.tableCard.getSelectedRows().map((row) => row.attributes['path'])[0];
        const baseExportName = getPathParameter()
            ? (this.tableCard.getSelectedRows().map((row) => row.attributes['name'])[0] || 'export') + '-' + getBranchParameter()
            : getRepoParameter() + '-' + getBranchParameter();
        const defaultExportName = baseExportName + '-' + toLocalDateTimeFormat(new Date(), '-', '-');
        showInputDialog({
            title: "Export node",
            confirmationLabel: "EXPORT",
            label: "Export name",
            placeholder: defaultExportName,
            value: defaultExportName,
            callback: (value) => this.doExportNode(nodePath, value || defaultExportName)
        });
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
                        currentPathBreadcrumb.setStateRef('nodes', {repo: repositoryName, branch: branchName, path: constCurrentPath});
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
                           'See <a class="rcd-material-link" href="http://xp.readthedocs.io/en/6.10/developer/node-domain/nodes.html">Nodes</a> for more information. ';

        const structureDefinition = 'This view represents nodes in a tree structure. ' +
                                    'While this solution is adapted to repositories like com.enonic.cms.default or system-repo, ' +
                                    'it may be problematic for custom repositories or for nodes with too many children. ' +
                                    'In these cases, we recommend to use the Node Search or the admin tool ' +
                                    '<a class="rcd-material-link" href="https://market.enonic.com/vendors/runar-myklebust/repoxplorer">repoXPlorer</a>.';

        const viewDefinition = 'The view lists in a table all the direct children nodes of the current node (or the root node for a branch). Click on a row to display its direct children.';
        new HelpDialog('Node Tree', [definition, structureDefinition, viewDefinition]).init().addActionDefinition({
            iconSrc: config.assetsUrl + '/icons/export-icon.svg',
            definition: 'Export the selected node into $XP_HOME/data/export/[export-name]. The display will switch to the Exports view.'
        }).addActionDefinition({
            iconSrc: config.assetsUrl + '/icons/import-icon.svg',
            definition: 'Import previously exported nodes as children under the current node (or as root node)'
        }).addActionDefinition({
            iconSrc: config.assetsUrl + '/icons/rename.svg',
            definition: 'Move or rename node(s). If the value ends in slash \'/\', it specifies the parent path where to be moved. ' +
                        'Otherwise, it means the new desired path or name for the node (available only if one node is selected).'
        }).addActionDefinition({
            iconName: 'filter_list',
            definition: 'Filter the nodes based on a query expression. ' +
                        'Example: "_id = \'role:system.admin"\'. ' +
                        'See <a class="rcd-material-link" href="http://xp.readthedocs.io/en/6.10/reference/query-language.html#compareexpr">Query language</a> for more information.'
        }).addActionDefinition({
            iconName: 'sort',
            definition: 'Sort the nodes based on an expression. ' +
                        'The sorting expression is composed of a node property to sort on and the direction: ascending or descending.' +
                        'Examples: "_ts DESC", "_name ASC"'
        }).addActionDefinition({iconName: 'delete', definition: 'Delete the selected nodes.'}).addActionDefinition({
            iconName: 'info',
            definition: 'Display the node view containing more details and actions about this node.'
        }).addActionDefinition({iconSrc: config.assetsUrl + '/icons/json.svg', definition: 'Display the node as JSON.'}).open();
    }
}
