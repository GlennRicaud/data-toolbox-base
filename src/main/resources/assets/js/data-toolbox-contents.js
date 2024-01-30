class ContentsRoute extends DtbRoute {
    constructor() {
        super({
            state: 'contents'
        });
    }

    onDisplay() {
        this.refreshBreadcrumbs();
        this.retrieveContents();
    }

    createBreadcrumbsLayout() {
        const helpIconArea = new RcdGoogleMaterialIconArea('help', () => this.displayHelp()).init().setTooltip('Help');
        this.breadcrumbsLayout = new RcdMaterialBreadcrumbsLayout().init().addChild(helpIconArea);
        return this.breadcrumbsLayout;
    }

    createLayout() {
        this.tableCard = new RcdMaterialTableCard('Contents',).init()
            .addColumn('Name')
            .addColumn('Display Name')
            .addColumn('', {icon: true})
            //.addIconArea(new RcdGoogleMaterialIconArea('add_circle', () => this.createContent()).setTooltip('Create a content', RcdMaterialTooltipAlignment.RIGHT).init(), {max: 0})
            .addIconArea(new RcdGoogleMaterialIconArea('delete', () => this.deleteContents()).init().setTooltip('Delete selected contents', RcdMaterialTooltipAlignment.RIGHT), {min: 1});
        return new RcdMaterialLayout().init().addChild(this.tableCard);
    }

    retrieveContents() {
        const infoDialog = showShortInfoDialog('Retrieving content list...');
        this.tableCard.deleteRows();
        const parentStateRef = this.getParentPath()?
            buildStateRef('contents', {
                project: getProjectParameter(),
                path: this.getParentPath(),
            }) : buildStateRef('projects');
        this.tableCard.createRow({selectable:false})
            .addCell('..', {href: parentStateRef})
            .addCell('', {href: parentStateRef})
            .addCell(null, {icon: true});
        return requestPostJson(config.servicesUrl + '/content-getchildren', {
            data: {
                projectId: getProjectParameter(),
                parentPath: getPathParameter()
            }
        })
            .then((result) => {
                result.success.hits.sort((content1, content2) => content1.name - content2.name).forEach((content) => {
                    const rowStateRef = buildStateRef('contents', {project: getProjectParameter(), path: content._path});
                    const displayJsonCallback = () => this.displayContentAsJson(content._id, content._name);
                    const displayJsonIconArea = new RcdImageIconArea(config.assetsUrl + '/icons/json.svg', (source, event) => {
                        displayJsonCallback();
                        event.stopPropagation();
                    }).init().setTooltip('Display as JSON');
                    const row = this.tableCard.createRow()
                        .addCell(content._name, {href: rowStateRef})
                        .addCell(content.displayName || '', {href: rowStateRef})
                        .addCell(displayJsonIconArea, {icon: true})
                        .setAttribute('content', content._id);
                    row.checkbox.addClickListener((event) => event.stopPropagation());
                });
            })
            .catch(handleRequestError)
            .finally(() => infoDialog.close());
    }

    createContent() {
        const defaultContentName = 'content-' + toLocalDateTimeFormat(new Date(), '-', '-').toLowerCase();
        showInputDialog({
            title: 'Create content',
            label: 'Content name',
            placeholder: defaultContentName,
            value: defaultContentName,
            confirmationLabel: 'CREATE',
            callback: (value) => this.doCreateContent(value || defaultContentName)
        });
    }

    doCreateContent(contentName) {
        const infoDialog = showLongInfoDialog('Creating content...');
        requestPostJson(config.servicesUrl + '/content-create', {
            data: {
                contentName: contentName || ('content-' + toLocalDateTimeFormat(new Date(), '-', '-')).toLowerCase()
            }
        })
            .then((result) => displaySuccess('Content created'))
            .catch(handleRequestError)
            .finally(() => {
                infoDialog.close();
                this.retrieveContents();
            });
    }

    displayContentAsJson(key, name) {
        const infoDialog = showShortInfoDialog("Retrieving content info...");
        return requestPostJson(config.servicesUrl + '/content-get', {
            data: {
                projectId: getProjectParameter(),
                key: key
            }
        })
            .then((result) => {
                const formattedJson = this.formatJson(result.success);
                showDetailsDialog('Content [' + name + ']', formattedJson).addClass('node-details-dialog');
            })
            .catch(handleRequestError)
            .finally(() => infoDialog.close());
    }

    deleteContents() {
        showConfirmationDialog("Delete selected contents?", 'DELETE', () => this.doDeleteContents());
    }

    doDeleteContents() {
        const infoDialog = showLongInfoDialog("Deleting contents...");
        const keys = this.tableCard.getSelectedRows().map((row) => row.attributes['content']);
        requestPostJson(config.servicesUrl + '/content-delete', {
            data: {
                projectId: getProjectParameter(),
                keys: keys
            }
        })
            .then((result) => handleTaskCreation(result, {
                taskId: result.taskId,
                message: 'Deleting contents...',
                doneCallback: () => displaySuccess('Content' + (keys.length > 1 ? 's' : '') + ' deleted'),
                alwaysCallback: () => this.retrieveContents()
            }))
            .catch(handleRequestError)
            .finally(() => infoDialog.close());
    }

    refreshBreadcrumbs() {
        this.breadcrumbsLayout.setBreadcrumbs([
            new RcdMaterialBreadcrumb('Data Toolbox').init().setStateRef(''),
            new RcdMaterialBreadcrumb('Content Tree').init().setStateRef('projects')]);

        const projectId = getProjectParameter();
        const path = getPathParameter();
        if (path === '/') {
            app.setTitle(projectId);
            this.breadcrumbsLayout.addBreadcrumb(new RcdMaterialBreadcrumb(projectId).init())
            return
        }

        this.breadcrumbsLayout.addBreadcrumb(new RcdMaterialBreadcrumb(projectId).init().setStateRef('contents', {project: projectId, path: '/'}))

        const pathElements = path.substring(1).split('/')
        app.setTitle(pathElements[pathElements.length - 1]);

        let currentPath = '';
        pathElements.forEach((subPathElement, index, array) => {
            currentPath += '/' + subPathElement;
            const constCurrentPath = currentPath;

            const currentPathBreadcrumb = new RcdMaterialBreadcrumb(subPathElement).init();
            if (index < array.length - 1) {
                currentPathBreadcrumb.setStateRef('contents', {
                    project: projectId,
                    path: constCurrentPath
                });
            }
            this.breadcrumbsLayout.addBreadcrumb(currentPathBreadcrumb);
        });
    }

    displayHelp() {
        const definition = 'Enonic XP data is shipped with an embedded hybrid CMS.<br/>' +
            'See <a class="rcd-material-link" href="https://developer.enonic.com/docs/xp/stable/cms">CMS</a> for more information.';

        const viewDefinition = 'This view lists in a table all the contents. Click on a row to display its children.';

        new HelpDialog('Contents', [definition, viewDefinition]).init()
            //.addActionDefinition({iconName: 'add_circle', definition: 'Create a content with default settings'})
            .addActionDefinition({iconName: 'delete', definition: 'Delete the selected contents.'})
            .open();
    }
}
