class VersionsRoute extends DtbRoute {
    constructor() {
        super({
            state: 'versions'
        });
    }

    onDisplay() {
        this.refreshBreadcrumbs();
        this.retrieveVersions();
    }

    createLayout() {
        this.tableCard = new RcdMaterialTableCard('Versions', {selectable: false}).init()
            .addClass('dtb-table-card-versions')
            .addColumn('Version ID<br/>Path')
            .addColumn('Info', {classes: ['non-mobile-cell']})
            .addColumn('Timestamp')
            .addColumn('', {icon: true});

        return new RcdMaterialLayout().init()
            .addChild(this.tableCard);
    }

    retrieveVersions() {
        const infoDialog = showShortInfoDialog('Retrieving versions...');
        this.tableCard.deleteRows();
        this.tableCard.createRow({selectable: false})
            .addCell('..')
            .addCell('', {classes: ['non-mobile-cell']})
            .addCell('')
            .addCell('', {icon: true})
            .addClass('rcd-clickable')
            .addClickListener(() => setState('node', {
                repo: getRepoParameter(),
                branch: getBranchParameter(),
                path: getIdParameter()
            }));
        return requestPostJson(config.servicesUrl + '/version-list', {
            data: {
                repositoryName: getRepoParameter(),
                branchName: getBranchParameter(),
                id: getIdParameter(),
                start: getStartParameter(),
                count: getCountParameter()
            }
        })
            .then((result) => this.onVersionsRetrieval(result))
            .catch(handleRequestError)
            .finally(() => infoDialog.close());
    }

    onVersionsRetrieval(result) {
        const versions = result.success.hits;

        versions.forEach(version => {

            const displayNodeBlobCallback = () => this.displayBlobAsJson('Node', version.nodeBlobKey);
            const displayIndexBlobCallback = () => this.displayBlobAsJson('Index', version.indexConfigBlobKey);
            const displayAccessBlobCallback = () => this.displayBlobAsJson('Access', version.accessControlBlobKey);
            const moreIconAreaItems = [
                {text: 'Display node blob', callback: displayNodeBlobCallback},
                {text: 'Display index blob', callback: displayIndexBlobCallback},
                {text: 'Display access blob', callback: displayAccessBlobCallback},
            ];
            if (version.nodeCommitId) {
                moreIconAreaItems.push({text: 'Display commit', callback: () => this.displayCommitAsJson(version.nodeCommitId)})
            }
            const moreIconArea = new RcdGoogleMaterialIconArea('more_vert', (source, event) => {
                RcdMaterialMenuHelper.displayMenu(source, moreIconAreaItems, 200)
                event.stopPropagation();
            }).init()
                .setTooltip('Display...');

            this.tableCard.createRow()
                .addCell(version.versionId + '<br/>' + version.nodePath)
                .addCell((version.branches ? 'Active in: ' + version.branches : '') + '<br/>' +
                         (version.nodeCommitId ? 'Committed' : ''),
                    {classes: ['non-mobile-cell']})
                .addCell(version.timestamp)
                .addCell(moreIconArea, {icon: true});

        });

        const startInt = parseInt(getStartParameter());
        const countInt = parseInt(getCountParameter());
        const rowCountCallback = (rowCount) => setState('versions', {
            repo: getRepoParameter(),
            branch: getBranchParameter(),
            path: getPathParameter(),
            id: getIdParameter(),
            start: getStartParameter(),
            count: rowCount
        });
        const previousCallback = () => setState('versions', {
            repo: getRepoParameter(),
            branch: getBranchParameter(),
            path: getPathParameter(),
            id: getIdParameter(),
            start: Math.max(0, startInt - countInt),
            count: getCountParameter()
        });
        const nextCallback = () => setState('versions', {
            repo: getRepoParameter(),
            branch: getBranchParameter(),
            path: getPathParameter(),
            id: getIdParameter(),
            start: startInt + countInt,
            count: getCountParameter()
        });
        this.tableCard.setFooter({
            rowCount: parseInt(getCountParameter()),
            start: parseInt(getStartParameter()),
            count: versions.length,
            total: result.success.total,
            rowCountCallback: rowCountCallback,
            previousCallback: previousCallback,
            nextCallback: nextCallback
        });
    }

    displayCommitAsJson(nodeCommitId) {
        const infoDialog = showShortInfoDialog("Retrieving commit...");
        return requestPostJson(config.servicesUrl + '/commit-get', {
            data: {
                repositoryName: getRepoParameter(),
                nodeCommitId: nodeCommitId
            }
        })
            .then((result) => {
                const formattedJson = this.formatJson(result.success, '');
                showDetailsDialog('Commit [' + nodeCommitId + ']', formattedJson)
                    .addClass('node-details-dialog');
            })
            .catch(handleRequestError)
            .finally(() => infoDialog.close());
    }

    refreshBreadcrumbs() {
        const repositoryName = getRepoParameter();
        const branchName = getBranchParameter();
        const path = getPathParameter();

        this.breadcrumbsLayout.setBreadcrumbs([new RcdMaterialBreadcrumb('Data Toolbox').init().setStateRef(''),
            new RcdMaterialBreadcrumb('Data Tree').init().setStateRef('repositories'),
            new RcdMaterialBreadcrumb(repositoryName).init().setStateRef('branches', {repo: repositoryName}),
            new RcdMaterialBreadcrumb(branchName).init().setStateRef('nodes', {repo: repositoryName, branch: branchName})]);

        const rootBreadcrumb = new RcdMaterialBreadcrumb(path === '/' ? 'root!versions' : 'root').init();
        if (path !== '/') {
            rootBreadcrumb.setStateRef('nodes', {repo: repositoryName, branch: branchName, path: '/'});
        }
        this.breadcrumbsLayout.addBreadcrumb(rootBreadcrumb);

        if (path === '/') {
            app.setTitle('Root node versions');
        } else {
            const pathElements = path.substring(1).split('/')
            app.setTitle(pathElements[pathElements.length - 1] + ' versions');

            let currentPath = '';
            pathElements.forEach((subPathElement, index, array) => {
                currentPath += '/' + subPathElement;
                const constCurrentPath = currentPath;
                const currentPathBreadcrumb = new RcdMaterialBreadcrumb(
                    index < array.length - 1 ? subPathElement : subPathElement + '!versions').init();
                if (index < array.length - 1) {
                    currentPathBreadcrumb.setStateRef('nodes', {repo: repositoryName, branch: branchName, path: constCurrentPath});
                }
                this.breadcrumbsLayout.addBreadcrumb(currentPathBreadcrumb);
            });
        }
    }

    displayHelp() {
        const viewDefinition = 'Node versions. ' +
                               'See <a class="rcd-material-link" href="https://developer.enonic.com/docs/xp/stable/storage/branches">Repo branches</a> for more information';
        new HelpDialog('Versions', [viewDefinition]).init()
            .open();
    }
}
