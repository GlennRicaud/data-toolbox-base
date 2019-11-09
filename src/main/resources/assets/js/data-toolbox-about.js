class AboutRoute extends DtbRoute {
    constructor() {
        super({
            state: 'about',
            name: 'About',
            iconArea: new RcdGoogleMaterialIconArea('info').init()
        });
    }

    onDisplay() {
        this.retrieveAboutInformation();
    }

    createBreadcrumbsLayout() {
        return new RcdMaterialBreadcrumbsLayout().init().addBreadcrumb(
            new RcdMaterialBreadcrumb('Data Toolbox').init().setStateRef('')).addBreadcrumb(
            new RcdMaterialBreadcrumb('About').init()).addChild(
            new RcdGoogleMaterialIconArea('help', () => this.displayHelp()).init().setTooltip('Help'));
    }

    createLayout() {
        this.listCard = new RcdMaterialListCard().init();
        return new RcdMaterialLayout().init().addChild(this.listCard);
    }

    retrieveAboutInformation() {
        const infoDialog = showShortInfoDialog('Retrieving information...');
        return $.ajax({
            url: config.servicesUrl + '/about'
        }).done((result) => {
            this.listCard.deleteRows();
            if (handleResultError(result)) {
                const displayMarketCallback = () =>
                    window.open('https://market.enonic.com/vendors/glenn-ricaud/systems.rcd.enonic.datatoolbox', '_blank');
                const githubRepoCallback = () => window.open('https://github.com/GlennRicaud/data-toolbox-app')
                const reportIssueCallback = () => window.open('https://github.com/GlennRicaud/data-toolbox-app/issues/new?body=Enonic XP: ' +
                                                              result.success.app.xpVersion + ' %0A' +
                                                              'Data Toolbox: ' + result.success.app.version + '%0A%0A' +
                                                              'Bug description: &labels=bug', '_blank');
                this.listCard.addRow('Data Toolbox')
                    .addRow('Version ' + result.success.app.version, 'Running on Enonic XP ' + result.success.app.xpVersion)
                    .addRow('Display market page ', null,
                        {callback: displayMarketCallback, icon: new RcdGoogleMaterialIcon('open_in_new').init()})
                    .addRow('Github repository', 'Feel free to star :)',
                        {callback: githubRepoCallback, icon: new RcdImageIcon(config.assetsUrl + '/icons/github.svg').init()})
                    .addRow('Report an issue ', null,
                        {callback: reportIssueCallback, icon: new RcdImageIcon(config.assetsUrl + '/icons/github.svg').init()});
            }
        }).fail(handleAjaxError).always(() => {
            infoDialog.close();
        });
    }

    displayHelp() {
        new HelpDialog('About', ['Information about Data Toolbox']).init().open();
    }

}
