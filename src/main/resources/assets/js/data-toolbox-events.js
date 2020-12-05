class EventsCard extends RcdMaterialCard {
    constructor() {
        super({title: 'Events'});

        this.count = 0;
        this.playing = false;
        this.playIconArea = new RcdGoogleMaterialIconArea('play_arrow', () => this.play(true))
            .init()
            .enable(!this.playing);
        this.pauseIconArea = new RcdGoogleMaterialIconArea('pause', () => this.play(false))
            .init();
        this.clearIconArea = new RcdGoogleMaterialIconArea('clear', () => this.clear()).init();
        this.actionsPanel = new RcdDivElement().init()
            .addClass('dtb-events-actions')
            .addChild(this.playIconArea)
            .addChild(this.pauseIconArea)
            .addChild(this.clearIconArea);

        this.header.addChild(this.actionsPanel);
        this.eventsPanel = new RcdDivElement()
            .init()
            .addClass('events-panel');
    }

    init() {
        return super.init()
            .addChild(this.eventsPanel)
            .refresh();
    }

    play(play) {
        this.playing = play;
        this.refresh();
    }

    addEvent(eventText) {
        this.count++;
        const eventPanel = new RcdTextDivElement(eventText).init();
        this.eventsPanel.addChild(eventPanel);
        this.refresh();
        return this;
    }

    clear() {
        this.count = 0;
        this.eventsPanel.clear();
        this.refresh();
        return this;
    }

    refresh() {
        this.playIconArea.enable(!this.playing);
        this.pauseIconArea.enable(this.playing);
        this.clearIconArea.enable(this.count > 0);
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
        this.eventsCard = new EventsCard().init();
        eventManager.addEventListener((event) => this.onEvent(event))
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

    onEvent(event) {
        if (this.eventsCard.playing) {
            const eventData = JSON.parse(event.data);
            this.eventsCard.addEvent(this.formatJson(eventData))
        }
    }

}
