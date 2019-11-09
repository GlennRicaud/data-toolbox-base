class RepositoriesRoute extends DtbRoute {
    constructor() {
        super({
            state: 'repositories',
            name: 'Data Tree ',
            iconArea: new RcdImageIconArea(config.assetsUrl + '/icons/datatree.svg').init()
        });
    }

    onDisplay() {
        this.retrieveRepositories();
    }

    createBreadcrumbsLayout() {
        return new RcdMaterialBreadcrumbsLayout().init().addBreadcrumb(
            new RcdMaterialBreadcrumb('Data Toolbox').init().setStateRef('')).addBreadcrumb(
            new RcdMaterialBreadcrumb('Data Tree').init()).addChild(
            new RcdGoogleMaterialIconArea('help', () => this.displayHelp()).init().setTooltip('Help'));
    }

    createLayout() {
        this.tableCard = new RcdMaterialTableCard('Repositories').init().addColumn('Repository name').addIconArea(
            new RcdGoogleMaterialIconArea('add_circle', () => this.createRepository()).setTooltip('Create a repository',
                RcdMaterialTooltipAlignment.RIGHT).init(), {max: 0}).addIconArea(
            new RcdGoogleMaterialIconArea('delete', () => this.deleteRepositories()).init().setTooltip('Delete selected repositories',
                RcdMaterialTooltipAlignment.RIGHT),
            {min: 1});
        return new RcdMaterialLayout().init().addChild(this.tableCard);
    }

    retrieveRepositories() {
        const infoDialog = showShortInfoDialog('Retrieving repository list...');
        this.tableCard.deleteRows();
        return requestJson(config.servicesUrl + '/repository-list')
            .then((result) => {
                result.success.sort((repository1, repository2) => repository1.name - repository2.name).forEach((repository) => {
                    const row = this.tableCard.createRow().addCell(repository.name).setAttribute('repository',
                        repository.name).addClass('rcd-clickable').addClickListener(
                        () => setState('branches', {repo: repository.name}));
                    row.checkbox.addClickListener((event) => event.stopPropagation());
                });
            })
            .catch(handleRequestError)
            .finally(() => infoDialog.close());
    }

    createRepository() {
        const defaultRepositoryName = 'repository-' + toLocalDateTimeFormat(new Date(), '-', '-').toLowerCase();
        showInputDialog({
            title: 'Create repository',
            label: 'Repository name',
            placeholder: defaultRepositoryName,
            value: defaultRepositoryName,
            confirmationLabel: 'CREATE',
            callback: (value) => this.doCreateRepository(value || defaultRepositoryName)
        });
    }

    doCreateRepository(repositoryName) {
        const infoDialog = showLongInfoDialog('Creating repository...');
        requestPostJson(config.servicesUrl + '/repository-create', {
            data: {
                repositoryName: repositoryName || ('repository-' + toLocalDateTimeFormat(new Date(), '-', '-')).toLowerCase()
            }
        })
            .done((result) => displaySnackbar('Repository created'))
            .catch(handleRequestError)
            .finally(() => {
                infoDialog.close();
                this.retrieveRepositories();
            });
    }

    deleteRepositories() {
        showConfirmationDialog("Delete selected repositories?", 'DELETE', () => this.doDeleteRepositories());
    }

    doDeleteRepositories() {
        const infoDialog = showLongInfoDialog("Deleting repositories...");
        const repositoryNames = this.tableCard.getSelectedRows().map((row) => row.attributes['repository']);
        requestPostJson(config.servicesUrl + '/repository-delete', {
            data: {repositoryNames: repositoryNames}
        })
            .done((result) => displaySnackbar('Repositor' + (repositoryNames.length > 1 ? 'ies' : 'y') + ' deleted'))
            .catch(handleRequestError)
            .finally(() => {
                infoDialog.close();
                this.retrieveRepositories();
            });
    }

    displayHelp() {
        const definition = 'Enonic XP data is split in repositories. Enonic XP uses by default 2 repositories:<br/>' +
                           '"system-repo", the core repository, contains the users, groups, roles, installed application, settings of repositories, ...<br/>' +
                           '"com.enonic.cms.default", the content domain repository, contains the data managed by Content Studio.<br/>' +
                           'See <a class="rcd-material-link" href="http://xp.readthedocs.io/en/6.10/developer/node-domain/repository.html">Repository</a> for more information.';

        const viewDefinition = 'The view lists in a table all the repositories. Click on a row to display its branches.';

        new HelpDialog('Repositories', [definition, viewDefinition]).init().addActionDefinition(
            {iconName: 'add_circle', definition: 'Create a repository with default settings'}).addActionDefinition(
            {iconName: 'delete', definition: 'Delete the selected repositories.'}).open();
    }
}
