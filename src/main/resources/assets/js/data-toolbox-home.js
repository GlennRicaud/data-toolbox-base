class DetailsCard extends RcdDivElement {
    constructor(title, details = 'Loading...') {
        super();
        this.title = title;
        this.details = details;
    }

    init() {
        this.titleElement = new RcdTextElement(this.title).init();
        this.detailsElement = new RcdTextElement(this.details).init();
        return super.init()
            .addClass('dtb-details')
            .addChild(this.titleElement)
            .addChild(this.detailsElement);
    }

    setDetails(details) {
        this.details = details;
        this.detailsElement.setText(details);
        return this;
    }
}


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
        this.pathCard = new DetailsCard('Path').init();
        this.spaceCard = new DetailsCard('Free Space').init().addClass('dtb-space-details');
        return new RcdMaterialLayout().init()
            .addChild(this.pathCard)
            .addChild(this.spaceCard);
    }

    retrieveInformation() {
        const infoDialog = showShortInfoDialog('Retrieving information...');
        return requestJson(config.servicesUrl + '/home')
            .then((result) => {
                this.pathCard.setDetails(result.success.path);
                this.spaceCard.setDetails(
                    'Home: \t\t\t' + getSpaceInfo(result.success.home) + '\n' +
                    '|- Config: \t\t' + getSpaceInfo(result.success.config) + '\n' +
                    '|- Data: \t\t\t' + getSpaceInfo(result.success.data) + '\n' +
                    '\t|- Dump: \t' + getSpaceInfo(result.success.dump) + '\n' +
                    '\t|- Export: \t' + getSpaceInfo(result.success.export) + '\n' +
                    '|- Deploy: \t\t' + getSpaceInfo(result.success.deploy) + '\n' +
                    '|- Logs: \t\t\t' + getSpaceInfo(result.success.logs) + '\n' +
                    '|- Repo: \t\t\t' + getSpaceInfo(result.success.repo) + '\n' +
                    '\t|- Index: \t\t' + getSpaceInfo(result.success.index) + '\n' +
                    '\t|- Blob: \t\t' + getSpaceInfo(result.success.blob) + '\n' +
                    '|- Repo: \t\t\t' + getSpaceInfo(result.success.repo) + '\n' +
                    '|- Snapshots: \t' + getSpaceInfo(result.success.snapshots) + '\n' +
                    '|- Work: \t\t\t' + getSpaceInfo(result.success.work) + '\n');
            })
            .catch(handleRequestError)
            .finally(() => infoDialog.close());
    }

    displayHelp() {
        new HelpDialog('XP Home', ['Information about XP Home, the folder containing the stateful data of Enonic XP.', 'See https://developer.enonic.com/docs/xp/stable/deployment/distro#xp_home for more information.']).init().open();
    }
}
