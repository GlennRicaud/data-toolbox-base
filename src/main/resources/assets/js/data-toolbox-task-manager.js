class TaskManager extends RcdObject {
    constructor() {
        super();
        this.taskMap = {};
        this.taskMap[config.appName] = {};
        this.wsOpened = false;
        this.taskEventRegexp = /^{"type":"task\./;
    }

    init() {
        const socket = new WebSocket(config.wsUrl);
        socket.addEventListener('open', () => {
            this.wsOpened = true;
        });
        socket.addEventListener('message', (event) => {
            if (this.taskEventRegexp.test(event.data)) {
                const eventData = JSON.parse(event.data);
                const data = eventData.data;
                if ('task.finished' === eventData.type || 'task.updated' === eventData.type || 'task.submitted' === eventData.type) {
                    if (!this.taskMap[data.application]) {
                        this.taskMap[data.application] = {};
                    }
                    const applicationTaskMap = this.taskMap[data.application];
                    applicationTaskMap[data.id] = data;
                } else if ('task.removed' === eventData.type) {
                    const applicationTaskMap = this.taskMap[data.application];
                    if (applicationTaskMap) {
                        delete applicationTaskMap[data.id];
                    }
                }
            }
        });
        return this;
    }
    
    getDTTask(taskId) {
        return this.taskMap[config.appName][taskId];
    }


}
