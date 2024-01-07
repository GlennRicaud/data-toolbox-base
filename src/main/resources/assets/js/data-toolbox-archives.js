class ArchivesRoute extends DtbRoute {
    constructor() {
        super({
            state: 'archives'
        });
    }

    onDisplay() {
        this.retrieveArchives();
    }

    createBreadcrumbsLayout() {
        return new RcdMaterialBreadcrumbsLayout().init()
            .addBreadcrumb(new RcdMaterialBreadcrumb('Data Toolbox').init().setStateRef(''))
            .addBreadcrumb(new RcdMaterialBreadcrumb('Content Tree').init().setStateRef('projects'))
            .addBreadcrumb(new RcdMaterialBreadcrumb('Archives').init());
        //.addChild(new RcdGoogleMaterialIconArea('help', () => this.displayHelp()).init().setTooltip('Help'));
    }

    createLayout() {
        this.tableCard = new RcdMaterialTableCard('Archived contents', {selectable: false}).init()
            .addColumn('Name')
            .addColumn('Display Name')
            .addColumn('', {icon: true})
        //.addIconArea(new RcdImageIconArea(config.assetsUrl + '/icons/inventory_2.svg',  () => this.displayArchives()).setTooltip('Display archvies', RcdMaterialTooltipAlignment.RIGHT).init(), {min: 1,max:1})
        //.addIconArea(new RcdGoogleMaterialIconArea('delete', () => this.deleteArchives()).init().setTooltip('Delete selected archives', RcdMaterialTooltipAlignment.RIGHT), {min: 1});
        return new RcdMaterialLayout().init().addChild(this.tableCard);
    }

    retrieveArchives() {
        const infoDialog = showShortInfoDialog('Retrieving archive list...');
        this.tableCard.deleteRows();
        return requestPostJson(config.servicesUrl + '/node-getchildren', {
            data: {
                repositoryName: 'com.enonic.cms.' + getProjectParameter(),
                branchName: 'draft',
                parentPath: '/archive',
                start: getStartParameter(),
                count: getCountParameter()
            },
        }).then((result) => {
            result.success.hits.forEach((archive) => {
                const unarchiveIconArea = new RcdGoogleMaterialIconArea('unarchive.svg', (source, event) => {
                    this.restore(archive._id);
                    event.stopPropagation()
                }).setTooltip('Display archives').init();
                const row = this.tableCard.createRow({selectable: false})
                    .addCell(archive._name)
                    .addCell(archive.displayName)
                    .addCell(unarchiveIconArea, {icon: true})
                    .setAttribute('archive', archive.id);
                //row.checkbox.addClickListener((event) => event.stopPropagation());
            });
        })
            .catch(handleRequestError)
            .finally(() => infoDialog.close());
    }

    restore(id) {
        showConfirmationDialog("Restore content?", 'RESTORE', () => this.doRestore(id));
    }

    doRestore(id) {
        const infoDialog = showLongInfoDialog("Restoring content...");
        requestPostJson(config.servicesUrl + '/content-restore', {
            data: {
                projectId: getProjectParameter(),
                id: id
            }
        })
            .then((result) => displaySuccess('Content restored'))
            .catch(handleRequestError)
            .finally(() => {
                infoDialog.close();
                this.retrieveArchives();
            });
    }

    displayHelp() {
        const definition = 'Enonic XP data is split into archives, silos where nodes can be stored.<br/>' +
            'By default 2 archives are present: ' +
            '<b>system-repo</b>, the core archive, containing the IAM data, installed applications, archive settings, ...' +
            'and <b>com.enonic.cms.default</b>, the CMS archive for the default archive.<br/>' +
            'See <a class="rcd-material-link" href="https://developer.enonic.com/docs/xp/stable/storage#archives">Archives</a> for more information.';

        const viewDefinition = 'This view lists in a table all the archives. Click on a row to display its branches.';

        new HelpDialog('Archives', [definition, viewDefinition]).init()
            .addActionDefinition({iconName: 'add_circle', definition: 'Create a archive with default settings'})
            .addActionDefinition({iconName: 'delete', definition: 'Delete the selected archives.'})
            .open();
    }
}
