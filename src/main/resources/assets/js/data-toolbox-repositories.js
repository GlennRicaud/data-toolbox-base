class RepositoriesRoute extends DtbRoute {
    constructor() {
        super({
            state: 'repositories',
            name: 'Node Tree ',
            iconArea: new RcdImageIconArea(config.assetsUrl + '/icons/datatree.svg').init()
        });
    }

    onDisplay() {
        this.retrieveRepositories();
    }

    createBreadcrumbsLayout() {
        return new RcdMaterialBreadcrumbsLayout().init().addBreadcrumb(
            new RcdMaterialBreadcrumb('Data Toolbox').init().setStateRef('')).addBreadcrumb(
            new RcdMaterialBreadcrumb('Node Tree').init()).addChild(
            new RcdGoogleMaterialIconArea('help', () => this.displayHelp()).init().setTooltip('Help'));
    }

    createLayout() {
        this.tableCard = new RcdMaterialTableCard('Repositories')
            .init()
            .addColumn('Repository name')
            .addIconArea(
                new RcdGoogleMaterialIconArea('add_circle', () => this.createRepository()).setTooltip('Create a repository',
                    RcdMaterialTooltipAlignment.RIGHT).init(), {max: 0})
            .addIconArea(
                new RcdImageIconArea(config.assetsUrl + '/icons/dump.svg', () => this.dumpRepositories()).init().setTooltip('Dump selected repositories'),
                {min: 1, predicate: () => {
                        return this.tableCard.getSelectedRows().every((row) => {
                            const repositoryName = row.attributes['repository'];
                            return repositoryName !== 'system-repo' && !repositoryName.startsWith('system.');
                        });
                    }})
            .addIconArea(
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

    dumpRepositories() {
        const infoDialog = showShortInfoDialog('Retrieving home information...');
        return requestJson(config.servicesUrl + '/home')
            .then((result) => {
                const repositoryNames = this.tableCard.getSelectedRows().map((row) => row.attributes['repository']);
                const commonPrefix = repositoryNames.reduce((prefix, name) => {
                    let i = 0;
                    while (i < prefix.length && i < name.length && prefix[i] === name[i]) i++;
                    return prefix.slice(0, i);
                });
                const defaultDumpName = (commonPrefix || 'dump') + '-' + toLocalDateTimeFormat(new Date(), '-', '-');
                new DtbDumpInputDialog({
                    defaultValue: defaultDumpName,
                    dirInfo: result.success.dump,
                    callback: (value) => this.doDumpRepositories(value, repositoryNames)
                }).init().open();
            })
            .catch(handleRequestError)
            .finally(() => infoDialog.close());
    }

    doDumpRepositories(params, repositoryNames) {
        const infoDialog = showLongInfoDialog('Creating dump...');
        requestPostJson(config.servicesUrl + '/dump-create', {
            data: {
                dumpName: params.name || ('dump-' + toLocalDateTimeFormat(new Date(), '-', '-')),
                includeVersions: params.includeVersions,
                archive: params.archive,
                maxVersions: params.maxVersions,
                maxVersionsAge: params.maxVersionsAge,
                repositoryNames: repositoryNames
            }
        })
            .then((result) => handleTaskCreation(result, {
                taskId: result.taskId,
                message: 'Creating dump...',
                doneCallback: (success) => new DumpResultDialog(success).init().open(),
                alwaysCallback: () => this.retrieveDumps()
            }))
            .catch(handleRequestError)
            .finally(() => infoDialog.close());
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
        const definition = 'Enonic XP data is split into repositories, silos where nodes can be stored.\n' +
            'By default 2 repositories are present: ' +
            'system-repo, the core repository, containing the IAM data, installed applications, repository settings, ...' +
            'and com.enonic.cms.default, the CMS repository for the default project.\n' +
            'See https://developer.enonic.com/docs/xp/stable/storage#repositories for more information.';

        const viewDefinition = 'This view lists in a table all the repositories. Click on a row to display its branches.';

        new HelpDialog('Repositories', [definition, viewDefinition]).init()
            .addActionDefinition({iconName: 'add_circle', definition: 'Create a repository with default settings'})
            .addActionDefinition({iconSrc: config.assetsUrl + '/icons/dump.svg', definition: 'Dump the selected repositories.'})
            .addActionDefinition({iconName: 'delete', definition: 'Delete the selected repositories.'})
            .open();
    }
}
