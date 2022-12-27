class HomeRoute extends DtbRoute {
    constructor() {
        super({
            state: 'home',
            name: 'XP Home',
            iconArea: new RcdGoogleMaterialIconArea('home').init()
        });
    }

    onDisplay() {
        this.retrieveInformation();
    }

    createBreadcrumbsLayout() {
        return new RcdMaterialBreadcrumbsLayout().init().addBreadcrumb(
            new RcdMaterialBreadcrumb('Data Toolbox').init().setStateRef('')).addBreadcrumb(
            new RcdMaterialBreadcrumb('XP Home').init()).addChild(
            new RcdGoogleMaterialIconArea('help', () => this.displayHelp()).init().setTooltip('Help'));
    }

    createLayout() {
        this.listCard = new RcdMaterialListCard().init();
        return new RcdMaterialLayout().init().addChild(this.listCard);
    }

    retrieveInformation() {
        const infoDialog = showShortInfoDialog('Retrieving information...');
        this.listCard.deleteRows();
        return requestJson(config.servicesUrl + '/home')
            .then((result) => {
                this.listCard.addRow('Home', this.getSpaceInfo(result.success.home))
                    .addRow('Home > Repo', this.getSpaceInfo(result.success.repo))
                    .addRow('Home > Work', this.getSpaceInfo(result.success.work))
                    .addRow('Home > Snapshots', this.getSpaceInfo(result.success.snapshots))
                    .addRow('Home > Data', this.getSpaceInfo(result.success.data));

            })
            .catch(handleRequestError)
            .finally(() => infoDialog.close());
    }

    displayHelp() {
        new HelpDialog('Home', ['Information about XP Home.']).init().open();
    }
}
