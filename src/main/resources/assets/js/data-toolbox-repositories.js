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
                    const row = this.tableCard.createRow()
                        .addCell(repository.name, {href: buildStateRef('branches', {repo: repository.name})})
                        .setAttribute('repository', repository.name);
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
            .then((result) => displaySuccess('Repository created'))
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
            .then((result) => displaySuccess('Repositor' + (repositoryNames.length > 1 ? 'ies' : 'y') + ' deleted'))
            .catch(handleRequestError)
            .finally(() => {
                infoDialog.close();
                this.retrieveRepositories();
            });
    }

    displayHelp() {
        const definition = 'Enonic XP data is split into repositories, silos where nodes can be stored.<br/>' +
                           'By default 2 repositories are present: ' +
                           '<b>system-repo</b>, the core repository, containing the IAM data, installed applications, repository settings, ...' +
                           'and <b>com.enonic.cms.default</b>, the CMS repository for the default project.<br/>' +
                           'See <a class="rcd-material-link" href="https://developer.enonic.com/docs/xp/stable/storage#repositories">Repositories</a> for more information.';

        const viewDefinition = 'This view lists in a table all the repositories. Click on a row to display its branches.';

        new HelpDialog('Repositories', [definition, viewDefinition]).init()
            .addActionDefinition({iconName: 'add_circle', definition: 'Create a repository with default settings'})
            .addActionDefinition({iconName: 'delete', definition: 'Delete the selected repositories.'})
            .open();
    }
}
