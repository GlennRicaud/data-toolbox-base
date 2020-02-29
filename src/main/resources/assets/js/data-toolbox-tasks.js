class TasksRoute extends DtbRoute {
    constructor() {
        super({
            state: 'tasks',
            name: 'Tasks',
            iconArea: new RcdGoogleMaterialIconArea('event_note').init()
        });
    }

    onDisplay() {
        this.displayed = true;
        this.retrieveTasks();
    }

    onHide() {
        this.displayed = false;
    }

    createBreadcrumbsLayout() {
        return new RcdMaterialBreadcrumbsLayout().init()
            .addBreadcrumb(new RcdMaterialBreadcrumb('Data Toolbox').init().setStateRef(''))
            .addBreadcrumb(new RcdMaterialBreadcrumb('Tasks').init())
            .addChild(new RcdGoogleMaterialIconArea('help', () => this.displayHelp()).init().setTooltip('Help'));
    }

    createLayout() {
        this.tableCard = new RcdMaterialTableCard('Tasks', {selectable: false})
            .init()
            .addColumn('Name<br/>Description')
            .addColumn('Application', {classes: ['non-mobile-cell']})
            .addColumn('Progress', {classes: ['state-cell']});
        return new RcdMaterialLayout().init()
            .addChild(this.tableCard);
    }

    retrieveTasks() {
        this.tableCard.deleteRows();
        this.doRetrieveTasks();
    }

    doRetrieveTasks() {
        retrieveTasks({
            applicationKey: getApplicationParameter()
        })
            .then((tasks) => this.onRetrievedTasks(tasks));
    }

    onRetrievedTasks(tasks) {
        this.tableCard.deleteRows();
        tasks.forEach(task => {
            const row = this.tableCard.createRow({selectable: false})
                .addCell(task.name + '<br/>' + task.description)
                .addCell(task.application, {classes: ['non-mobile-cell']})
                .addCell(task.state === 'RUNNING'
                         ? task.progress.info
                         : task.state, {classes: ['state-cell']});
            if (task.state === 'RUNNING' && task.progress.total > 0) {
                const cellSize = this.tableCard.table.header.row.children[3].domElement.offsetWidth;
                const progressIndicator = new RcdLinearProgressIndicator({width: cellSize - 24, height: 8})
                    .init()
                    .setProgress(task.progress.current / task.progress.total);
                row.children[3].addChild(progressIndicator);
            }
        });
        if (taskManager && this.displayed) {
            setTimeout(() => this.doRetrieveTasks(), 200);
        }
    }

    displayHelp() {
        const fullName = 'Tasks';
        const definition = 'All users and groups are created and managed in ID providers. ' +
                           'Each Enonic XP installation has a System ID provider that cannot be deleted. ' +
                           'Additional id providers can be created as needed.';

        const viewDefinition = 'The view lists in a table all the ID providers';
        new HelpDialog('IAM', [fullName, definition, viewDefinition]).init()
            .addActionDefinition({iconName: 'person', definition: 'Display the users for this ID provider'})
            .addActionDefinition({iconName: 'group', definition: 'Display the groups for this ID provider'})
            .open();
    }

}
