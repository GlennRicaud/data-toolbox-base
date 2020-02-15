class UsersRoute extends DtbRoute {
    constructor() {
        super({
            state: 'users'
        });
    }

    onDisplay() {
        app.setTitle(getIdProviderParameter() + ' users');
        this.leafBreadcrumb.setText(getIdProviderParameter() + '!users');
        this.retrieveUsers();
    }

    createBreadcrumbsLayout() {
        this.leafBreadcrumb = new RcdMaterialBreadcrumb('Users').init();
        return new RcdMaterialBreadcrumbsLayout().init()
            .addBreadcrumb(new RcdMaterialBreadcrumb('Data Toolbox').init().setStateRef(''))
            .addBreadcrumb(new RcdMaterialBreadcrumb('IAM').init().setStateRef('iam'))
            .addBreadcrumb(this.leafBreadcrumb)
            .addChild(new RcdGoogleMaterialIconArea('help', () => this.displayHelp()).init().setTooltip('Help'));
    }

    createLayout() {
        const filterIconArea = new RcdGoogleMaterialIconArea('filter_list', () => this.filterUsers())
            .init()
            .setTooltip('Filter users');
        const sortIconArea = new RcdGoogleMaterialIconArea('sort', () => this.sortUsers())
            .init()
            .setTooltip('Sort users');
        const deleteIconArea = new RcdGoogleMaterialIconArea('delete', () => this.deleteUsers())
            .init()
            .setTooltip('Delete selected users', RcdMaterialTooltipAlignment.RIGHT);
        this.tableCard = new RcdMaterialTableCard('Users')
            .init()
            .addColumn('Name')
            .addColumn('Display Name')
            .addColumn('Email')
            .addIconArea(filterIconArea, {max: 0})
            .addIconArea(sortIconArea, {max: 0})
            .addIconArea(deleteIconArea, {min: 1});
        return new RcdMaterialLayout().init()
            .addChild(this.tableCard);
    }

    retrieveUsers() {
        const infoDialog = showShortInfoDialog('Retrieving user list...');
        this.tableCard.deleteRows();
        return requestPostJson(config.servicesUrl + '/user-query', {
            data: {
                idProviderKey: getIdProviderParameter(),
                start: getStartParameter(),
                count: getCountParameter(),
                filter: getFilterParameter(),
                sort: getSortParameter()
            }
        })
            .then((result) => this.onUsersRetrieval(result))
            .catch(handleRequestError)
            .finally(() => infoDialog.close());
    }

    onUsersRetrieval(result) {
        result.success.hits
            .forEach((user) => {
                this.tableCard.createRow()
                    .addCell(user.name)
                    .addCell(user.displayName)
                    .addCell(user.email)
                    .setAttribute('key', user.key)
                    .setAttribute('name', user.name);
            });

        const startInt = parseInt(getStartParameter());
        const countInt = parseInt(getCountParameter());
        const previousCallback = () => setState('users', {
            idprovider: getIdProviderParameter(),
            start: Math.max(0, startInt - countInt),
            count: getCountParameter(),
            filter: getFilterParameter(),
            sort: getSortParameter()
        });
        const nextCallback = () => setState('users', {
            idprovider: getIdProviderParameter(),
            start: startInt + countInt,
            count: getCountParameter(),
            filter: getFilterParameter(),
            sort: getSortParameter()
        });
        this.tableCard.setFooter({
            start: parseInt(getStartParameter()),
            count: result.success.hits.length,
            total: result.success.total,
            previousCallback: previousCallback,
            nextCallback: nextCallback
        });
    }

    deleteUsers() {
        const keys = this.tableCard.getSelectedRows()
            .map((row) => row.attributes['key']);
        return super.deletePrincipals({keys: keys, type: 'user'});
    }

    filterUsers() {
        showInputDialog({
            title: "Filter users",
            confirmationLabel: "FILTER",
            label: "Query expression",
            placeholder: '',
            value: decodeURIComponent(getFilterParameter()),
            callback: (value) => setState('users', {
                idprovider: getIdProviderParameter(),
                start: 0,
                count: getCountParameter(),
                filter: encodeURIComponent(value),
                sort: getSortParameter()
            })
        });
    }

    sortUsers() {
        showInputDialog({
            title: "Sort users",
            confirmationLabel: "SORT",
            label: "Sort expression",
            placeholder: '',
            value: decodeURIComponent(getSortParameter()),
            callback: (value) => setState('users', {
                idprovider: getIdProviderParameter(),
                start: 0,
                count: getCountParameter(),
                filter: getFilterParameter(),
                sort: encodeURIComponent(value)
            })
        });
    }

    displayHelp() {
        const definition = 'The System ID provider has two built-in users. ' +
                           'One is the Super User which has full administrative permissions. ' +
                           'The other is the Anonymous User which is the principal used by any site visitor that is not logged in.';

        const viewDefinition = 'The view lists in a table all the users for the current ID provider';
        new HelpDialog('Users', [definition, viewDefinition]).init()
            .addActionDefinition({
                iconName: 'filter_list',
                definition: 'Filter the users based on a query expression. Examples: "login = \'su\'", "email LIKE \'*@enonic.com\'". '
            })
            .addActionDefinition({
                iconName: 'sort', definition: 'Sort the users based on an expression. ' +
                                              'The sorting expression is composed of a property to sort on and the direction: ascending or descending.' +
                                              'Examples: "login DESC", "email ASC"'
            })
            .addActionDefinition({iconName: 'delete', definition: 'Delete the selected users.'})
            .open();
    }

}
