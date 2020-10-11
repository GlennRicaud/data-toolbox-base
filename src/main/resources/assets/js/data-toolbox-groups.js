class GroupsRoute extends DtbRoute {
    constructor() {
        super({
            state: 'groups'
        });
    }

    onDisplay() {
        app.setTitle(getIdProviderParameter() + ' groups');
        this.leafBreadcrumb.setText(getIdProviderParameter() + '!groups');
        this.retrieveGroups();
    }

    createBreadcrumbsLayout() {
        this.leafBreadcrumb = new RcdMaterialBreadcrumb('Groups').init();
        return new RcdMaterialBreadcrumbsLayout().init()
            .addBreadcrumb(new RcdMaterialBreadcrumb('Data Toolbox').init().setStateRef(''))
            .addBreadcrumb(new RcdMaterialBreadcrumb('IAM').init().setStateRef('iam'))
            .addBreadcrumb(this.leafBreadcrumb)
            .addChild(new RcdGoogleMaterialIconArea('help', () => this.displayHelp()).init().setTooltip('Help'));
    }

    createLayout() {
        const deleteIconArea = new RcdGoogleMaterialIconArea('delete', () => this.deleteGroups())
            .init()
            .setTooltip('Delete selected groups', RcdMaterialTooltipAlignment.RIGHT);
        this.tableCard = new RcdMaterialTableCard('Groups')
            .init()
            .addColumn('Name')
            .addColumn('Display Name')
            .addIconArea(deleteIconArea, {min: 1});
        return new RcdMaterialLayout().init()
            .addChild(this.tableCard);
    }

    retrieveGroups() {
        const infoDialog = showShortInfoDialog('Retrieving group list...');
        this.tableCard.deleteRows();
        return requestPostJson(config.servicesUrl + '/group-list', {
            data: {
                idProviderKey: getIdProviderParameter(),
                start: getStartParameter(),
                count: getCountParameter()
            }
        })
            .then((result) => this.onGroupsRetrieval(result))
            .catch(handleRequestError)
            .finally(() => infoDialog.close());
    }

    onGroupsRetrieval(result) {
        result.success.hits
            .forEach((user) => {
                this.tableCard.createRow()
                    .addCell(user.name)
                    .addCell(user.displayName)
                    .setAttribute('key', user.key)
                    .setAttribute('name', user.name);
            });

        const startInt = parseInt(getStartParameter());
        const countInt = parseInt(getCountParameter());
        const rowCountCallback = (rowCount) => setState('groups', {
            idprovider: getIdProviderParameter(),
            start: getStartParameter(),
            count: rowCount
        });
        const previousCallback = () => setState('groups', {
            idprovider: getIdProviderParameter(),
            start: Math.max(0, startInt - countInt),
            count: getCountParameter()
        });
        const nextCallback = () => setState('groups', {
            idprovider: getIdProviderParameter(),
            start: startInt + countInt,
            count: getCountParameter()
        });
        this.tableCard.setFooter({
            rowCount: parseInt(getCountParameter()),
            start: parseInt(getStartParameter()),
            count: result.success.hits.length,
            total: result.success.total,
            rowCountCallback: rowCountCallback,
            previousCallback: previousCallback,
            nextCallback: nextCallback
        });
    }

    deleteGroups() {
        const keys = this.tableCard.getSelectedRows()
            .map((row) => row.attributes['key']);
        return super.deletePrincipals({keys: keys, type: 'group'});
    }

    displayHelp() {
        const definition = 'Groups assist with managing user permissions for content. ' +
                           'For example, all contents have security permissions which may include roles, groups and users. ' +
                           'If a content has only one group named “Customers” (with read access) then only logged in members of that group can see the content. ' +
                           'See <a class="rcd-material-link" href="https://developer.enonic.com/docs/xp/stable/iam">IAM</a> for more information.';

        const viewDefinition = 'The view lists in a table all the groups for the current ID provider';
        new HelpDialog('Groups', [definition, viewDefinition]).init()
            .addActionDefinition({iconName: 'delete', definition: 'Delete the selected groups.'})
            .open();
    }

}
