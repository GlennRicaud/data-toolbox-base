class UsersRoute extends DtbRoute {
    constructor() {
        super({
            state: 'users'
        });
    }

    onDisplay() {
        this.retrieveUsers();
    }

    createBreadcrumbsLayout() {
        return new RcdMaterialBreadcrumbsLayout().init()
            .addBreadcrumb(new RcdMaterialBreadcrumb('Data Toolbox').init().setStateRef(''))
            .addBreadcrumb(new RcdMaterialBreadcrumb('Users').init())
            .addChild(new RcdGoogleMaterialIconArea('help', () => this.displayHelp()).init().setTooltip('Help'));
    }

    createLayout() {
        this.tableCard = new RcdMaterialTableCard('Users')
            .init()
            .addColumn('Name')
            .addColumn('Display Name')
            .addColumn('Email');
        return new RcdMaterialLayout().init()
            .addChild(this.tableCard);
    }

    retrieveUsers() {
        const infoDialog = showShortInfoDialog('Retrieving user list...');
        this.tableCard.deleteRows();
        return requestPostJson(config.servicesUrl + '/user-list', {
            data: {
                idProviderKey: getIdProviderParameter()
            }
        })
            .then((result) => {
                result.success.hits
                    .forEach((user) => {
                        this.tableCard.createRow({selectable: false})
                            .addCell(user.name)
                            .addCell(user.displayName)
                            .addCell(user.email)
                            .setAttribute('key', user.key)
                            .setAttribute('name', user.name);
                    });
            })
            .catch(handleRequestError)
            .finally(() => infoDialog.close());
    }

    displayHelp() {
        new HelpDialog('IAM', ['Identity and Access Management']).init().open();
    }

}
