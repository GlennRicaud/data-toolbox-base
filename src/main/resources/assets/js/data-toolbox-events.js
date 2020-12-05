class EventsCard extends RcdMaterialCard {
    constructor() {
        super({title: 'Events'});
        this.playing = false;
        this.typeRegexp = null;
        this.playIconArea = new RcdGoogleMaterialIconArea('play_arrow', () => this.play())
            .init()
            .setTooltip('Listen to events');
        this.stopIconArea = new RcdGoogleMaterialIconArea('stop', () => this.stop())
            .init()
            .setTooltip('Stop listening');
        this.actionsPanel = new RcdDivElement().init()
            .addClass('dtb-events-actions')
            .addChild(this.playIconArea)
            .addChild(this.stopIconArea);
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

    play() {
        showInputDialog({
            title: "Listen to events",
            confirmationLabel: "LISTEN",
            label: "Filter by type (optional)",
            placeholder: 'ex: node\.created',
            callback: (value) => {
                this.eventsPanel.clear();
                this.typeRegexp = value ? new RegExp(value) : null;
                this.playing = true;
                this.refresh()
            }
        });
    }

    stop() {
        this.playing = false;
        this.refresh();
    }

    refresh() {
        this.playIconArea.enable(!this.playing);
        this.stopIconArea.enable(this.playing);
        return this;
    }

    addEvent(eventText) {
        const eventPanel = new RcdTextDivElement(eventText).init();
        this.eventsPanel.addChild(eventPanel);
        this.refresh();
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
        const viewDefinition = 'The view allows to listen to events for the current Enonic XP instance. See <a class="rcd-material-link" href="https://developer.enonic.com/docs/xp/stable/framework/events ">Events</a> for more information. A filtering by type can be applied using a regular expression';
        new HelpDialog('Events', [viewDefinition])
            .init()
            .open();
    }

    onEvent(event) {
        if (this.eventsCard.playing) {
            const eventData = JSON.parse(event.data);
            if (!this.eventsCard.typeRegexp || (eventData.type && eventData.type.match(this.eventsCard.typeRegexp))) {
                this.eventsCard.addEvent(this.formatJson(eventData))
            }
        }
    }

}
