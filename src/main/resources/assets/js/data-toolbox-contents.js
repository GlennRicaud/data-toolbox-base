class ContentsRoute extends DtbRoute {
    constructor() {
        super({
            state: 'contents'
        });
    }

    onDisplay() {
        this.retrieveContents();
    }

    createBreadcrumbsLayout() {
        return new RcdMaterialBreadcrumbsLayout().init().addBreadcrumb(
            new RcdMaterialBreadcrumb('Data Toolbox').init().setStateRef('')).addBreadcrumb(
            new RcdMaterialBreadcrumb('Content Tree').init()).addChild(
            new RcdGoogleMaterialIconArea('help', () => this.displayHelp()).init().setTooltip('Help'));
    }

    createLayout() {
        this.tableCard = new RcdMaterialTableCard('Contents').init()
            .addColumn('Name')
            .addColumn('Display Name')
            //.addIconArea(new RcdGoogleMaterialIconArea('add_circle', () => this.createContent()).setTooltip('Create a content', RcdMaterialTooltipAlignment.RIGHT).init(), {max: 0})
            //.addIconArea(new RcdGoogleMaterialIconArea('delete', () => this.deleteContents()).init().setTooltip('Delete selected contents', RcdMaterialTooltipAlignment.RIGHT), {min: 1});
        return new RcdMaterialLayout().init().addChild(this.tableCard);
    }

    retrieveContents() {
        const infoDialog = showShortInfoDialog('Retrieving content list...');
        this.tableCard.deleteRows();
        return requestPostJson(config.servicesUrl + '/content-getchildren', {
            data: {projectId: getProjectParameter()}
        })
            .then((result) => {
                result.success.hits.sort((content1, content2) => content1.name - content2.name).forEach((content) => {
                    const rowStateRef = buildStateRef('contents', {content: content.id});
                    const row = this.tableCard.createRow()
                        .addCell(content._name, {href: rowStateRef})
                        .addCell(content.displayName || '', {href: rowStateRef})
                        //.setAttribute('content', content.id);
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

    deleteContents() {
        showConfirmationDialog("Delete selected contents?", 'DELETE', () => this.doDeleteContents());
    }

    doDeleteContents() {
        const infoDialog = showLongInfoDialog("Deleting contents...");
        const contentNames = this.tableCard.getSelectedRows().map((row) => row.attributes['content']);
        requestPostJson(config.servicesUrl + '/content-delete', {
            data: {contentNames: contentNames}
        })
            .then((result) => displaySuccess('Repositor' + (contentNames.length > 1 ? 'ies' : 'y') + ' deleted'))
            .catch(handleRequestError)
            .finally(() => {
                infoDialog.close();
                this.retrieveContents();
            });
    }

    displayHelp() {
        const definition = 'Enonic XP data is split into contents, silos where nodes can be stored.<br/>' +
            'By default 2 contents are present: ' +
            '<b>system-repo</b>, the core content, containing the IAM data, installed applications, content settings, ...' +
            'and <b>com.enonic.cms.default</b>, the CMS content for the default content.<br/>' +
            'See <a class="rcd-material-link" href="https://developer.enonic.com/docs/xp/stable/storage#contents">Contents</a> for more information.';

        const viewDefinition = 'This view lists in a table all the contents. Click on a row to display its branches.';

        new HelpDialog('Contents', [definition, viewDefinition]).init()
            .addActionDefinition({iconName: 'add_circle', definition: 'Create a content with default settings'})
            .addActionDefinition({iconName: 'delete', definition: 'Delete the selected contents.'})
            .open();
    }
}
