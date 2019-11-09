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
        this.tableCard = new RcdMaterialTableCard('Branches').init().
            addColumn('Branch name').
            addIconArea(new RcdGoogleMaterialIconArea('add_circle', () => this.createBranch()).init().setTooltip('Create a branch'), {max: 0}).
            addIconArea(new RcdGoogleMaterialIconArea('delete', () => this.deleteBranches()).init().setTooltip('Delete selected branches', RcdMaterialTooltipAlignment.RIGHT), {min: 1});
        return new RcdMaterialLayout().init().
            addChild(this.tableCard);
    }
    
    retrieveBranches() {
        const infoDialog = showShortInfoDialog('Retrieving branch list...');
        return $.ajax({
            method: 'POST',
            url: config.servicesUrl + '/repository-get',
            data: JSON.stringify({repositoryName: getRepoParameter()}),
            contentType: 'application/json; charset=utf-8'
        }).done((result) => {
            this.tableCard.deleteRows();

            const parentRow = this.tableCard.createRow({selectable:false}).
                addCell('..').
                addClass('rcd-clickable').
                addClickListener(() => setState('repositories'));

            if (handleResultError(result)) {
                result.success.branches.sort((branch1, branch2) => branch1 - branch2).
                forEach((branch) => {
                    const row = this.tableCard.createRow().
                        addCell(branch).
                        setAttribute('branch', branch).
                        addClass('rcd-clickable').
                        addClickListener(() => setState('nodes',{repo: getRepoParameter() , branch: branch}));
                    row.checkbox.addClickListener((event) => event.stopPropagation());
                });
            }
        }).fail(handleAjaxError).always(() => {
            infoDialog.close();
        });
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
        $.ajax({
            method: 'POST',
            url: config.servicesUrl + '/branch-create',
            data: JSON.stringify({
                repositoryName: getRepoParameter(),
                branchName: branchName || ('branch-' + toLocalDateTimeFormat(new Date(), '-', '-')).toLowerCase()
            }),
            contentType: 'application/json; charset=utf-8'
        })
            .done((result) => handleResultError(result) &&  displaySnackbar('Branch created'))
            .fail(handleAjaxError).always(() => {
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
        $.ajax({
            method: 'POST',
            url: config.servicesUrl + '/branch-delete',
            data: JSON.stringify({
                repositoryName: getRepoParameter(),
                branchNames: branchNames
            }),
            contentType: 'application/json; charset=utf-8'
        })
            .done((result) => handleResultError(result) &&  displaySnackbar('Branch' + (branchNames.length > 1 ?'es' : '') + ' deleted'))
            .fail(handleAjaxError).always(() => {
            infoDialog.close();
            this.retrieveBranches();
        });
    }

    refreshBreadcrumbs() {
        this.breadcrumbsLayout.
            setBreadcrumbs([new RcdMaterialBreadcrumb('Data Toolbox').init().setStateRef(''),
                new RcdMaterialBreadcrumb('Data Tree').init().setStateRef('repositories'),
                new RcdMaterialBreadcrumb(getRepoParameter()).init()]);
    }

    displayHelp() {
        const definition = 'A branch is a set of data in a repository.  All repositories have a default branch called master. ' +
                           'Any number of branches can be added to facilitate your data. ' +
                           'For example, the com.enonic.cms.default repository contains two branches:' +
                           '"draft" containing the content as seen in the Content Studio and ' +
                           '"master" containing the published content served by the portal.<br/>' +
                           'See <a class="rcd-material-link" href="http://xp.readthedocs.io/en/6.10/developer/node-domain/branch.html">Branch</a> for more information.';

        const viewDefinition = 'The view lists in a table all the branches of the current repository. Click on a row to display its root node.';

        new HelpDialog('Branches', [definition, viewDefinition]).
            init().
            addActionDefinition({iconName: 'add_circle', definition: 'Create a branch with default settings'}).
            addActionDefinition({iconName: 'delete', definition: 'Delete the selected branches.'}).
            open();
    }
}
