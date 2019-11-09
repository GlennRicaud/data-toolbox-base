function createPresentationRoute() {

    class ViewSummary extends RcdDivElement {
        constructor(params) {
            super();
            this.state = params.state;
            this.name = new RcdSpanElement().init().
                setText(params.name).
                addClass('view-summary-title');
            this.icon = new RcdImageIcon(config.assetsUrl + '/icons/views/' + params.iconFileName).init();
            this.text = new RcdPElement().init().setText(params.text);
        }

        init() {
            return super.init().
                addClass('view-summary').
                addChild(this.icon).
                addChild(this.name).
                addChild(this.text).
                addClickListener(() => setState(this.state));
        }
    }

    const exportsSectionContent = new RcdPElement().init().
        setText('A node export is a serialization of a given content/node. ' +
                'This makes node exports well suited for transferring a specific content to another installation. ' +
                'Warning: The current export mechanism does not export old versions of your data. You will loose the version history of your contents. ' +
                'See <a class="rcd-material-link" href="http://xp.readthedocs.io/en/6.10/operations/export.html">Export and Import</a> for more information.');

    const subTitle = new RcdH2Element().init().
        setText('A web interface to visualize and manage your Enonic XP data');

    const repositoriesViewSummary = new ViewSummary({
        state: 'repositories',
        name: 'Data Tree',
        iconFileName: 'datatree.svg',
        text:'Browse and manage your repositories, branches and nodes.'
    }).init();
    const snapshotsViewSummary = new ViewSummary({
        state: 'snapshots',
        name: 'Snapshots',
        iconFileName: 'snapshots.svg',
        text:'Record the state of your indexes at specific times. Rollback to these snapshots when needed.'
    }).init();
    const exportsViewSummary = new ViewSummary({
        state: 'exports',
        name: 'Node Exports',
        iconFileName: 'exports.svg',
        text:'Manage your node exports.'
    }).init();
    const dumpsViewSummary = new ViewSummary({
        state: 'dumps',
        name: 'System dumps',
        iconFileName: 'dumps.svg',
        text:'Generate and manage your system dumps.'
    }).init();
    const searchViewSummary = new ViewSummary({
        state: 'search',
        name: 'Search',
        iconFileName: 'search.svg',
        text:'Query nodes from all your repositories or a specific context.'
    }).init();
    const aboutViewSummary = new ViewSummary({
        state: 'about',
        name: 'About',
        iconFileName: 'about.svg',
        text:'Access information about this application.'
    }).init();
    const viewSummaries = new RcdDivElement().init().
        addClass('view-summaries').
        addChild(repositoriesViewSummary).
        addChild(snapshotsViewSummary).
        addChild(exportsViewSummary).
        addChild(dumpsViewSummary).
        addChild(searchViewSummary).
        addChild(aboutViewSummary);

    const layout = new RcdMaterialLayout().init().
        addClass('presentation-view').
        addChild(subTitle).
        addChild(viewSummaries);

    return {
        callback: (main) => {
            main.addChild(layout);
            app.setTitle('Data Toolbox');
        }
    };
}
