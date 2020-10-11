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
        const definition = 'Tasks allow the asynchronous execution of jobs. See <a class="rcd-material-link" href="https://developer.enonic.com/docs/xp/stable/framework/tasks">Tasks</a> for more information.';
        const viewDefinition = 'The view lists in a table all the tasks and their progress';
        new HelpDialog('Tasks', [definition, viewDefinition])
            .init()
            .open();
    }

}
