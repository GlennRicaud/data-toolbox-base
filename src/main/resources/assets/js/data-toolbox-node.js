class NodeDetailsCard extends RcdDivElement {
    constructor() {
        super();
    }

    init() {
        return super.init()
            .addClass('dtb-node-details');
    }

    setMeta(meta) {
        const primaryElement = new RcdTextElement('System properties').init();
        const detailsText = 'ID: ' + meta._id + '<br/>' +
                            'Path: ' + meta._path + '<br/>' +
                            'Version key: ' + meta._versionKey + '<br/>' +
                            'Type: ' + meta._nodeType + '<br/>' +
                            'Timestamp: ' + meta._ts + '<br/>' +
                            'State: ' + meta._state + '<br/>' +
                            'Child order: ' + meta._childOrder + '<br/>' +
                            'Manual order value: ' + (meta._manualOrderValue || '');
        const detailsElement = new RcdTextElement(detailsText).init();
        this.addChild(primaryElement).addChild(detailsElement);
    }
}

class NodeRoute extends DtbRoute {
    constructor() {
        super({
            state: 'node'
        });
    }

    onDisplay() {
        this.refreshBreadcrumbs();
        this.retrieveMeta();
    }

    createLayout() {
        this.nodeDetails = new NodeDetailsCard()
            .init();

        this.mainDisplayCard = new RcdMaterialListCard().init()
            .addClass('dtb-node-display-card');

        this.actionsCard = new RcdMaterialListCard().init();
        this.displayIndexDocumentCard = new RcdMaterialListCard().init();

        const firstColumn = new RcdDivElement().init()
            .addClass('dtb-node-column')
            .addChild(this.nodeDetails)
            .addChild(this.actionsCard);

        const secondColumn = new RcdDivElement().init()
            .addClass('dtb-node-column')
            .addChild(this.mainDisplayCard)
            .addChild(this.displayIndexDocumentCard);

        return new RcdMaterialLayout()
            .init()
            .addClass('dtb-node-layout')
            .addClass('dtb-responsive-row')
            .addChild(firstColumn)
            .addChild(secondColumn);
    }

    retrieveMeta() {
        const infoDialog = showShortInfoDialog('Retrieving system properties...');
        this.nodeDetails.clear();
        this.mainDisplayCard.deleteRows();
        this.actionsCard.deleteRows();
        this.displayIndexDocumentCard.deleteRows();
        return requestPostJson(config.servicesUrl + '/meta-get', {
            data: {
                repositoryName: getRepoParameter(),
                branchName: getBranchParameter(),
                key: getKeyParameter()
            }
        })
            .then((result) => this.onMetaRetrieval(result))
            .catch(handleRequestError)
            .finally(() => infoDialog.close());
    }

    onMetaRetrieval(result) {
        const meta = result.success;

        if (getIdParameter()) {
            this.refreshBreadcrumbsFromPath(meta._path);
        }

        this.nodeDetails.setMeta(meta);

        const displaySiblingsCallback = () => setState('nodes',
            {repo: getRepoParameter(), branch: getBranchParameter(), path: this.getParentPath(meta._path)});
        const displayChildrenCallback = () => setState('nodes',
            {repo: getRepoParameter(), branch: getBranchParameter(), path: meta._path});
        const displayPropertiesCallback = () => setState('properties',
            {repo: getRepoParameter(), branch: getBranchParameter(), path: meta._path});
        const displayPermissionsCallback = () => setState('permissions',
            {repo: getRepoParameter(), branch: getBranchParameter(), path: meta._path});
        const displayJsonCallback = () => this.displayNodeAsJson(meta._id);
        const displayVersionsCallback = () => setState('versions',
            {repo: getRepoParameter(), branch: getBranchParameter(), id: meta._id, path: meta._path});

        this.mainDisplayCard
            .addRow('Display siblings', null,
                {callback: displaySiblingsCallback, icon: new RcdImageIcon(config.assetsUrl + '/icons/datatree.svg').init()})
            .addRow('Display children', null,
                {callback: displayChildrenCallback, icon: new RcdImageIcon(config.assetsUrl + '/icons/datatree.svg').init()})
            .addRow('Display properties', null,
                {callback: displayPropertiesCallback, icon: new RcdImageIcon(config.assetsUrl + '/icons/properties.svg').init()})
            .addRow('Display permissions', null,
                {callback: displayPermissionsCallback, icon: new RcdGoogleMaterialIcon('lock').init()})
            .addRow('Display as JSON', null,
                {callback: displayJsonCallback, icon: new RcdImageIcon(config.assetsUrl + '/icons/json.svg').init()})
            .addRow('Display versions', null,
                {callback: displayVersionsCallback, icon: new RcdImageIcon(config.assetsUrl + '/icons/properties.svg').init()});

        this.actionsCard
            .addRow('Export node', null,
                {callback: () => this.exportNode(meta), icon: new RcdImageIcon(config.assetsUrl + '/icons/export-icon.svg').init()})
            .addRow('Move/rename node', null, {
                callback: () => this.moveNode([{
                    id: meta._id,
                    path: meta._path,
                    callback: () => setState('node', {repo: getRepoParameter(), branch: getBranchParameter(), id: meta._id})
                }]),
                icon: new RcdImageIcon(config.assetsUrl + '/icons/rename.svg').init()
            })
            .addRow('Delete node', null,
                {
                    callback: () => this.deleteNodes({
                        nodeKeys: [meta._id],
                        callback: () => setState('nodes',
                            {repo: getRepoParameter(), branch: getBranchParameter(), path: this.getParentPath(meta._path)})
                    }),
                    icon: new RcdGoogleMaterialIcon('delete').init()
                });


        this.displayIndexDocumentCard
            .addRow('Display Search Index Document', null, {
                callback: () => this.displayIndexDocument('Search', meta._id),
                icon: new RcdImageIcon(config.assetsUrl + '/icons/es.svg').init()
            })
            .addRow('Display Branch Index Document', null, {
                callback: () => this.displayIndexDocument('Branch', meta._id, meta._versionKey),
                icon: new RcdImageIcon(config.assetsUrl + '/icons/es.svg').init()
            })
            .addRow('Display Version Index Document', null, {
                callback: () => this.displayIndexDocument('Version', meta._id, meta._versionKey),
                icon: new RcdImageIcon(config.assetsUrl + '/icons/es.svg').init()
            });

    }

    displayIndexDocument(type, id, versionKey) {
        const infoDialog = showShortInfoDialog("Retrieving index document...");
        return requestPostJson(config.servicesUrl + '/document-get', {
            data: {
                repositoryName: getRepoParameter(),
                branchName: getBranchParameter(),
                type: type.toLowerCase(),
                id: id,
                versionKey: versionKey
            }
        })
            .then((result) => {
                const formattedJson = this.formatJson(result.success);
                showDetailsDialog(type + ' Index Document [' + id + ']', formattedJson).addClass('node-details-dialog');
            })
            .catch(handleRequestError)
            .finally(() => infoDialog.close());
    }

    exportNode(meta) {
        const baseExportName = meta._name + '-' + getBranchParameter();
        const defaultExportName = baseExportName + '-' + toLocalDateTimeFormat(new Date(), '-', '-');
        showInputDialog({
            title: "Export node",
            confirmationLabel: "EXPORT",
            label: "Export name",
            placeholder: defaultExportName,
            value: defaultExportName,
            callback: (value) => this.doExportNode(meta._path, value || defaultExportName)
        });
    }

    refreshBreadcrumbs() {
        const id = getIdParameter();
        if (id) {
            this.refreshBreadcrumbsFromId(id);
        } else {
            this.refreshBreadcrumbsFromPath(getPathParameter());
        }

    }

    refreshBreadcrumbsFromId(id) {
        const fullId = getRepoParameter() + ':' + getBranchParameter() + ':' + id;
        this.breadcrumbsLayout.setBreadcrumbs([
            new RcdMaterialBreadcrumb('Data Toolbox').init().setStateRef(''),
            new RcdMaterialBreadcrumb('Node Search').init().setStateRef('search'),
            new RcdMaterialBreadcrumb('Node ' + fullId).init()
        ]);
        app.setTitle(fullId);
    }

    refreshBreadcrumbsFromPath(path) {
        const repositoryName = getRepoParameter();
        const branchName = getBranchParameter();
        const fullId = repositoryName + ':' + branchName + ':' + path;

        this.breadcrumbsLayout.setBreadcrumbs([new RcdMaterialBreadcrumb('Data Toolbox').init().setStateRef(''),
            new RcdMaterialBreadcrumb('Data Tree').init().setStateRef('repositories'),
            new RcdMaterialBreadcrumb(repositoryName).init().setStateRef('branches', {repo: repositoryName}),
            new RcdMaterialBreadcrumb(branchName).init().setStateRef('nodes', {repo: repositoryName, branch: branchName})]);

        const rootBreadcrumb = new RcdMaterialBreadcrumb(path === '/' ? 'root!info' : 'root').init();
        if (path !== '/') {
            rootBreadcrumb.setStateRef('nodes', {repo: repositoryName, branch: branchName, path: '/'});
        }
        this.breadcrumbsLayout.addBreadcrumb(rootBreadcrumb);

        if (path !== '/') {
            const pathElements = path.substring(1).split('/')
            let currentPath = '';
            pathElements.forEach((subPathElement, index, array) => {
                currentPath += '/' + subPathElement;
                const constCurrentPath = currentPath;
                const currentPathBreadcrumb = new RcdMaterialBreadcrumb(
                    index < array.length - 1 ? subPathElement : subPathElement + '!info').init();
                if (index < array.length - 1) {
                    currentPathBreadcrumb.setStateRef('nodes', {repo: repositoryName, branch: branchName, path: constCurrentPath});
                }
                this.breadcrumbsLayout.addBreadcrumb(currentPathBreadcrumb);
            });
        }

        app.setTitle(fullId);
    }

    displayHelp() {
        const definition = 'A Node represents a single storable entity of data. ' +
                           'It can be compared to a row in sql or a document in document oriented storage models.<br/>' +
                           'See <a class="rcd-material-link" href="https://developer.enonic.com/docs/xp/stable/storage#nodes">Nodes</a> for more information. ';

        const viewDefinition = 'This view gathers the <a class="rcd-material-link" href="https://developer.enonic.com/docs/xp/stable/storage/system-properties">System properties</a>' +
                               ' and a list of actions to manage the node or retrieve more information about it.';
        new HelpDialog('Node', [definition, viewDefinition]).init().open();
    }
}
