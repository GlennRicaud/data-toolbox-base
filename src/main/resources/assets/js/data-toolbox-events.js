class EventsCard extends RcdMaterialCard {
    constructor() {
        super({title: 'Events'});
        this.eventsPanel = new RcdDivElement()
            .init()
            .addClass('events-panel');
    }

    init() {
        return super.init()
            .addChild(this.eventsPanel);
    }

    addEvent(eventText) {
        const eventPanel = new RcdTextDivElement(eventText).init();
        this.eventsPanel.addChild(eventPanel);
        return this;
    }
}

class EventsRoute extends DtbRoute {
    constructor() {
        super({
            state: 'events',
            name: 'Events',
            iconArea: new RcdGoogleMaterialIconArea('announcement').init()
        });
    }

    onDisplay() {
        this.displayed = true;
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
        this.eventsCard = new EventsCard().init()
            .addEvent(this.formatJson({a: "ee", b: 2}));
        return new RcdMaterialLayout().init()
            .addChild(this.eventsCard);
    }

    displayHelp() {
        const definition = 'Tasks allow the asynchronous execution of jobs. See <a class="rcd-material-link" href="https://developer.enonic.com/docs/xp/stable/framework/tasks">Tasks</a> for more information.';
        const viewDefinition = 'The view lists in a table all the tasks and their progress';
        new HelpDialog('Events', [definition, viewDefinition])
            .init()
            .open();
    }

}
