function createPresentationRoute() {

    class ViewSummary extends RcdAElement {
        constructor(params) {
            super(undefined, '#' + params.state);
            this.state = params.state;
            this.name = new RcdSpanElement().init()
                .setText(params.name).addClass('view-summary-title');
            this.icon = new RcdImageIcon(config.assetsUrl + '/icons/views/' + params.iconFileName).init();
            this.text = new RcdPElement().init()
                .setText(params.text);
        }

        init() {
            return super.init()
                .addClass('view-summary')
                .addChild(this.icon)
                .addChild(this.name)
                .addChild(this.text);
        }
    }

    const subTitle = new RcdH2Element().init()
        .setText('A web interface to visualize and manage your Enonic XP data');

    const repositoriesViewSummary = new ViewSummary({
        state: 'repositories',
        name: 'Data Tree',
        iconFileName: 'datatree.svg',
        text: 'Browse and manage your repositories, branches and nodes.'
    }).init();
    const snapshotsViewSummary = new ViewSummary({
        state: 'snapshots',
        name: 'Snapshots',
        iconFileName: 'snapshots.svg',
        text: 'Record the state of your indexes at specific times. Rollback to these snapshots when needed.'
    }).init();
    const exportsViewSummary = new ViewSummary({
        state: 'exports',
        name: 'Node Exports',
        iconFileName: 'exports.svg',
        text: 'Manage your node exports.'
    }).init();
    const dumpsViewSummary = new ViewSummary({
        state: 'dumps',
        name: 'System dumps',
        iconFileName: 'dumps.svg',
        text: 'Generate and manage your system dumps.'
    }).init();
    const searchViewSummary = new ViewSummary({
        state: 'search',
        name: 'Search',
        iconFileName: 'search.svg',
        text: 'Query nodes from all your repositories or a specific context.'
    }).init();
    const auditViewSummary = new ViewSummary({
        state: 'audit',
        name: 'Audit Log',
        iconFileName: 'audit.svg',
        text: 'Oversee audit log records.'
    }).init();
    const iamViewSummary = new ViewSummary({
        state: 'iam',
        name: 'IAM',
        iconFileName: 'group.svg',
        text: 'Identity and Access Management.'
    }).init();
    const tasksViewSummary = new ViewSummary({
        state: 'tasks',
        name: 'Tasks',
        iconFileName: 'tasks.svg',
        text: 'Monitor the state of tasks.'
    }).init();
    const eventsViewSummary = new ViewSummary({
        state: 'events',
        name: 'Events',
        iconFileName: 'events.svg',
        text: 'Listen to events.'
    }).init();
    const aboutViewSummary = new ViewSummary({
        state: 'about',
        name: 'About',
        iconFileName: 'about.svg',
        text: 'Access information about this application.'
    }).init();
    const viewSummaries = new RcdDivElement()
        .init()
        .addClass('view-summaries')
        .addChild(repositoriesViewSummary)
        .addChild(snapshotsViewSummary)
        .addChild(exportsViewSummary)
        .addChild(dumpsViewSummary)
        .addChild(searchViewSummary)
        .addChild(auditViewSummary)
        .addChild(iamViewSummary)
        .addChild(tasksViewSummary)
        .addChild(eventsViewSummary)
        .addChild(aboutViewSummary);

    const layout = new RcdMaterialLayout().init().addClass('presentation-view').addChild(subTitle).addChild(viewSummaries);

    return {
        callback: (main) => {
            main.addChild(layout);
            app.setTitle('Data Toolbox');
        }
    };
}
