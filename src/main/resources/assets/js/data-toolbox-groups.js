class GroupsRoute extends DtbRoute {
    constructor() {
        super({
            state: 'groups'
        });
    }

    onDisplay() {
        this.leafBreadcrumb.setText(getIdProviderParameter() + ' groups');
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
        this.tableCard = new RcdMaterialTableCard('Groups')
            .init()
            .addColumn('Name')
            .addColumn('Display Name');
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
                this.tableCard.createRow({selectable: false})
                    .addCell(user.name)
                    .addCell(user.displayName)
                    .setAttribute('key', user.key)
                    .setAttribute('name', user.name);
            });

        const startInt = parseInt(getStartParameter());
        const countInt = parseInt(getCountParameter());
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
            start: parseInt(getStartParameter()),
            count: result.success.hits.length,
            total: result.success.total,
            previousCallback: previousCallback,
            nextCallback: nextCallback
        });
    }

    displayHelp() {
        new HelpDialog('Groups', ['']).init().open();
    }

}
