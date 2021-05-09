class BranchesRoute extends DtbRoute {
    constructor() {
        super({
            state: 'branches'
        });
    }

    onDisplay() {
        app.setTitle(getRepoParameter());
        this.refreshBreadcrumbs();
        this.retrieveBranches();
    }

    createLayout() {
        this.tableCard = new RcdMaterialTableCard('Branches').init().addColumn('Branch name').addIconArea(
            new RcdGoogleMaterialIconArea('add_circle', () => this.createBranch()).init().setTooltip('Create a branch'),
            {max: 0}).addIconArea(
            new RcdGoogleMaterialIconArea('delete', () => this.deleteBranches()).init().setTooltip('Delete selected branches',
                RcdMaterialTooltipAlignment.RIGHT), {min: 1});
        return new RcdMaterialLayout().init().addChild(this.tableCard);
    }

    retrieveBranches() {
        const infoDialog = showShortInfoDialog('Retrieving branch list...');
        this.tableCard.deleteRows();
        this.tableCard.createRow({selectable: false})
            .addCell('..', {href: buildStateRef('repositories')});
        return requestPostJson(config.servicesUrl + '/repository-get', {
            data: {repositoryName: getRepoParameter()}
        })
            .then((result) => {
                result.success.branches.sort((branch1, branch2) => branch1 - branch2).forEach((branch) => {
                    const row = this.tableCard.createRow()
                        .addCell(branch, {href: buildStateRef('nodes', {repo: getRepoParameter(), branch: branch})})
                        .setAttribute('branch', branch);
                    row.checkbox.addClickListener((event) => event.stopPropagation());
                });
            })
            .catch(handleRequestError)
            .finally(() => infoDialog.close());
    }

    createBranch() {
        const defaultBranchName = 'branch-' + toLocalDateTimeFormat(new Date(), '-', '-').toLowerCase();
        showInputDialog({
            title: 'Create branch',
            label: 'Branch name',
            placeholder: defaultBranchName,
            value: defaultBranchName,
            confirmationLabel: 'CREATE',
            callback: (value) => this.doCreateBranch(value || defaultBranchName)
        });
    }

    doCreateBranch(branchName) {
        const infoDialog = showLongInfoDialog('Creating branch...');
        requestPostJson(config.servicesUrl + '/branch-create', {
            data: {
                repositoryName: getRepoParameter(),
                branchName: branchName || ('branch-' + toLocalDateTimeFormat(new Date(), '-', '-')).toLowerCase()
            }
        })
            .then((result) => displaySuccess('Branch created'))
            .catch(handleRequestError)
            .finally(() => {
                infoDialog.close();
                this.retrieveBranches();
            });
    }

    deleteBranches() {
        showConfirmationDialog('Delete selected branches?', 'DELETE', () => this.doDeleteBranches());
    }

    doDeleteBranches() {
        const infoDialog = showLongInfoDialog('Deleting branches...');
        const branchNames = this.tableCard.getSelectedRows().map((row) => row.attributes['branch']);
        requestPostJson(config.servicesUrl + '/branch-delete', {
            data: {
                repositoryName: getRepoParameter(),
                branchNames: branchNames
            }
        })
            .then(displaySuccess('Branch' + (branchNames.length > 1 ? 'es' : '') + ' deleted'))
            .catch(handleRequestError)
            .finally(() => {
                infoDialog.close();
                this.retrieveBranches();
            });
    }

    refreshBreadcrumbs() {
        this.breadcrumbsLayout.setBreadcrumbs([new RcdMaterialBreadcrumb('Data Toolbox').init().setStateRef(''),
            new RcdMaterialBreadcrumb('Data Tree').init().setStateRef('repositories'),
            new RcdMaterialBreadcrumb(getRepoParameter()).init()]);
    }

    displayHelp() {
        const definition = 'A branch is a set of data in a repository.  All repositories have a default branch called master. ' +
                           'Any number of branches can be added to facilitate your data. ' +
                           'For example, the com.enonic.cms.default repository contains two branches: ' +
                           '<b>draft</b> containing the content as seen in the Content Studio and ' +
                           '<b>master</b> containing the published content served by the portal.<br/>' +
                           'See <a class="rcd-material-link" href="https://developer.enonic.com/docs/xp/stable/storage#branches">Branches</a> for more information.';

        const viewDefinition = 'This view lists in a table all the branches of the current repository. Click on a row to display its root node.';

        new HelpDialog('Branches', [definition, viewDefinition]).init()
            .addActionDefinition({iconName: 'add_circle', definition: 'Create a branch'})
            .addActionDefinition({iconName: 'delete', definition: 'Delete the selected branches.'}).open();
    }
}
