class ListenEventsDialog extends RcdMaterialInputDialog {
    constructor(params) {
        super({
            title: "Listen to events",
            confirmationLabel: "LISTEN",
            label: "Filter by type (optional)",
            placeholder: 'ex: node\\.created',
            callback: (value) => params.callback({
                type: value,
                chronological: this.orderDropdown.getSelectedValue() === 'Chronological',
                maxEventCount: parseInt(this.maxEventCountField.getValue())
            })
        });

        this.orderDropdown = new RcdMaterialDropdown('Order', ['Chronological', 'Reverse chronological']).init();
        this.maxEventCountField = new RcdMaterialTextField('Maximum number of events displayed', '1024').init()
            .setPattern('[0-9]+')
            .setValue('50')
            .addInputListener(() => this.checkValidity());
    }

    init() {
        return super.init()
            .addItem(this.orderDropdown)
            .addItem(this.maxEventCountField);
    }

    checkValidity() {
        this.enable(this.isValid());
        return this;
    }

    isValid() {
        if (!this.maxEventCountField.checkValidity()) {
            return false;
        }
        return true;
    }
}

class EventsCard extends RcdMaterialCard {
    constructor() {
        super({title: 'Events'});
        this.playing = false;
        this.eventCount = 0;
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
            .addClass('dtb-events-card')
            .addChild(this.eventsPanel)
            .refresh();
    }

    play() {
        new ListenEventsDialog({
            callback: (listeningParams) => {
                this.eventsPanel.clear();
                this.listeningParams = listeningParams;
                this.typeRegexp = listeningParams.type ? new RegExp(listeningParams.type) : null;
                this.eventCount = 0;
                this.playing = true;
                this.refresh()
            }
        }).init()
            .open();
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
        this.eventsPanel.addChild(eventPanel, this.listeningParams.chronological);
        this.eventCount++;
        if (this.eventCount > this.listeningParams.maxEventCount) {
            this.eventsPanel.removeChild(this.eventsPanel.children[0]);
            this.eventCount--;
        }
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
        eventManager.addEventListener((event) => this.onEvent(event));
        return new RcdMaterialLayout().init()
            .addChild(this.eventsCard);
    }

    displayHelp() {
        const viewDefinition = 'The view allows to listen to and display events. ' +
                               'See <a class="rcd-material-link" href="https://developer.enonic.com/docs/xp/stable/framework/events ">Events</a> for more information. ' +
                               'A filtering by type can be applied using a regular expression. ' +
                               'When the maximum number of events displayed is reached, the oldest events will be discarded';
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
