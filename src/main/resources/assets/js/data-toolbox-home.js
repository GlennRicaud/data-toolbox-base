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
                    'Home: \t\t\t' + getSpaceInfo(result.success.home) + '<br/>' +
                    '|- Config: \t\t' + getSpaceInfo(result.success.config) + '<br/>' +
                    '|- Data: \t\t\t' + getSpaceInfo(result.success.data) + '<br/>' +
                    '\t|- Dump: \t' + getSpaceInfo(result.success.dump) + '<br/>' +
                    '\t|- Export: \t' + getSpaceInfo(result.success.export) + '<br/>' +
                    '|- Deploy: \t\t' + getSpaceInfo(result.success.deploy) + '<br/>' +
                    '|- Logs: \t\t\t' + getSpaceInfo(result.success.logs) + '<br/>' +
                    '|- Repo: \t\t\t' + getSpaceInfo(result.success.repo) + '<br/>' +
                    '\t|- Index: \t\t' + getSpaceInfo(result.success.index) + '<br/>' +
                    '\t|- Blob: \t\t' + getSpaceInfo(result.success.blob) + '<br/>' +
                    '|- Repo: \t\t\t' + getSpaceInfo(result.success.repo) + '<br/>' +
                    '|- Snapshots: \t' + getSpaceInfo(result.success.snapshots) + '<br/>' +
                    '|- Work: \t\t\t' + getSpaceInfo(result.success.work) + '<br/>');
            })
            .catch(handleRequestError)
            .finally(() => infoDialog.close());
    }

    displayHelp() {
        new HelpDialog('XP Home', ['Information about XP Home, the folder containing the stateful data of Enonic XP.', 'See <a class="rcd-material-link" href="https://developer.enonic.com/docs/xp/stable/deployment/distro#xp_home">XP Home</a> for more information.']).init().open();
    }
}
