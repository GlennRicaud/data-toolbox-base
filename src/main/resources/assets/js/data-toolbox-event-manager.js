class EventManager extends RcdObject {
    constructor() {
        super();
        this.opened = false;
        this.listeners = [];
    }

    init() {
        this.openSocket();
        return this;
    }

    initPromise() {
        return new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
            this.init();
        })
    }

    addEventListener(listener) {
        this.listeners.push(listener);
    }

    openSocket() {
        const socket = new WebSocket(config.wsUrl);
        socket.addEventListener('open', () => {
            this.opened = true;
            if (this.resolve) {
                this.resolve(this);
            }
        });
        socket.addEventListener('error', () => {
            this.opened = false;
            displayError("Error opening websocket connection");
            if (this.reject) {
                this.reject();
            }
        });
        socket.addEventListener('close', () => {
            this.opened = false;
        });
        socket.addEventListener('message', (event) => {
            this.listeners.forEach(listener => listener(event));
        });
        setInterval(() => {
            if (this.opened) {
                socket.send('KeepAlive');
            }
        }, 60000);
    }
}
