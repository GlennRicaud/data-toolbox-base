class TaskManager extends RcdObject {
    constructor(eventManager) {
        super();
        this.eventManager = eventManager;
        this.taskMap = {};
        this.applicationTaskMapMap = {};
        this.applicationTaskMapMap[config.appName] = {};
        this.open = false;
        this.taskEventRegexp = /^{"type":"task\./;
    }

    init() {
        requestJson(config.adminRestUrl + '/tasks')
            .then((result) => {
                result.tasks.forEach(task => this.addTask(task));
                this.eventManager.addEventListener((event) => this.onEvent(event));
                if (this.resolve) {
                    this.resolve(this);
                }
            })
            .catch((error) => {
                handleRequestError(error);
                if (this.reject) {
                    this.reject();
                }
            });
        return this;
    }

    initPromise() {
        return new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
            this.init();
        })
    }

    isLive() {
        return this.eventManager.opened;
    }

    onEvent(event) {
        if (this.taskEventRegexp.test(event.data)) {
            const eventData = JSON.parse(event.data);
            if ('task.finished' === eventData.type || 'task.updated' === eventData.type || 'task.submitted' === eventData.type) {
                this.addTask(eventData.data);
            } else if ('task.removed' === eventData.type) {
                this.removeTask(eventData.data);
            }
        }
    }

    addTask(task) {
        this.taskMap[task.id] = task;
        if (!this.applicationTaskMapMap[task.application]) {
            this.applicationTaskMapMap[task.application] = {};
        }
        const applicationTaskMap = this.applicationTaskMapMap[task.application];
        applicationTaskMap[task.id] = task;
    }

    removeTask(task) {
        delete this.taskMap[task.id];
        const applicationTaskMap = this.applicationTaskMapMap[task.application];
        if (applicationTaskMap) {
            delete applicationTaskMap[task.id];
        }
    }

    getTask(taskId) {
        return this.taskMap[taskId];
    }

    getTasks(applicationKey) {
        if (applicationKey) {
            const applicationTaskMap = this.applicationTaskMapMap[applicationKey];
            if (applicationTaskMap) {
                return Object.values(applicationTaskMap);
            }
            return [];
        }
        return Object.values(this.taskMap);
    }
}
