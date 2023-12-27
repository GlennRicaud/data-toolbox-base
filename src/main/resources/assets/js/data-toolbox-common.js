//
class HelpDialog extends RcdMaterialModalDialog {
    constructor(viewName, definitions = []) {
        super('Help: ' + viewName + ' view', undefined, true, true);
        this.definitions = definitions;
    }

    init() {
        const closeCallback = () => this.close();
        super.init()
            .addAction('CLOSE', closeCallback)
            .addKeyDownListener('Escape', closeCallback);

        this.definitions.forEach(definition => {
            const definitionElement = new RcdPElement().init().setText(definition).addClass('help-definition');
            this.addItem(definitionElement);
        });
        this.dialog.addClass('help-dialog');
        return this;
    }

    addActionDefinition(params) {
        const actionDefinition = new RcdDivElement().init().addClass('help-action-definition');
        if (params.iconName) {
            actionDefinition.addChild(new RcdGoogleMaterialIcon(params.iconName).init());
        } else if (params.iconSrc) {
            actionDefinition.addChild(new RcdImageIcon(params.iconSrc).init().addClass('image'));
        }
        actionDefinition.addChild(new RcdPElement().init().setText(params.definition));
        return this.addItem(actionDefinition);
    }
}

class ImportResultDialog extends RcdMaterialModalDialog {
    constructor(exportNames, result, type = 'node') {
        super('Import result', undefined, true, true);
        this.exportNames = exportNames;
        this.result = result;
        this.type = type;
    }

    init() {
        const closeCallback = () => this.close();
        const detailsCallback = () => this.displayDetails();

        let addedNodeCount = 0;
        let updatedNodeCount = 0;
        let importedBinaryCount = 0;
        let errorCount = 0;
        for (let i = 0; i < this.exportNames.length; i++) {
            const result = this.result[this.exportNames[i]];
            addedNodeCount += result.addedNodeCount;
            updatedNodeCount += result.updatedNodeCount;
            importedBinaryCount += result.importedBinaryCount;
            errorCount += result.errorCount;
        }
        const summary = 'Added ' + this.type + 's: ' + addedNodeCount + '\n' +
                        'Updated ' + this.type + 's: ' + updatedNodeCount + '\n' +
                        'Imported binaries: ' + importedBinaryCount + '\n' +
                        'Errors: ' + errorCount;
        const resultItem = new RcdTextElement(summary).init();

        super.init()
            .addItem(resultItem)
            .addAction('CLOSE', closeCallback)
            .addAction('DETAILS', detailsCallback)
            .addKeyDownListener('Escape', closeCallback);
        return this;
    }

    displayDetails() {
        this.close();

        let text = '';
        for (let i = 0; i < this.exportNames.length; i++) {
            if (this.exportNames.length > 1) {
                text += '<b>' + this.exportNames[i] + '</b>\n';
            }
            const result = this.result[this.exportNames[i]];
            const addedNodes = this.type === 'content' ? result.addedNodes.map(nodePathToContentPath) : result.addedNodes;
            const updatedNodes = this.type === 'content' ? result.updatedNodes.map(nodePathToContentPath) : result.updatedNodes;

            text += '# added ' + this.type + 's: ' + result.addedNodeCount + '\n' +
                    '# updated ' + this.type + 's: ' + result.updatedNodeCount + '\n' +
                    '# imported binaries: ' + result.importedBinaryCount + '\n' +
                    '# errors: ' + result.errorCount + '\n' +
                    'Added ' + this.type + 's: ' + JSON.stringify(addedNodes, null, 2) + '\n' +
                    'Updated ' + this.type + 's: ' + JSON.stringify(updatedNodes, null, 2) + '\n' +
                    'Imported binaries: ' + JSON.stringify(result.importedBinaries, null, 2) + '\n' +
                    'Errors: ' + JSON.stringify(result.errors, null, 2) + '\n\n';
        }
        showDetailsDialog('Import result details', text);
    }
}

class CreateChildNodeDialog extends RcdMaterialModalDialog {
    constructor(params) {
        super('Create child node', undefined, true, true);
        this.parentPath = params.parentPath;
        this.callback = params.callback;
        this.nameField = new RcdMaterialTextField('Name').init();
    }

    init() {
        const closeCallback = () => this.close();
        const createChildNodeCallback = () => this.createChildNode();

        super.init()
            .addItem(this.nameField)
            .addAction('CLOSE', closeCallback)
            .addAction('CREATE', createChildNodeCallback)
            .addKeyDownListener('Escape', closeCallback);
        return this;
    }

    open(parent) {
        super.open(parent);
        this.nameField.focus();
        return this;
    }

    createChildNode() {
        this.close();

        const infoDialog = showShortInfoDialog("Creating child node...");
        const name = this.nameField.getValue().trim();
        return requestPostJson(config.servicesUrl + '/node-create', {
            data: {
                repositoryName: getRepoParameter(),
                branchName: getBranchParameter(),
                parentPath : this.parentPath,
                name : name === '' ? undefined : name,
            }
        })
            .then(() => {
                displaySuccess('Child node created')
                if (this.callback) {
                    this.callback();
                }
            })
            .catch(handleRequestError)
            .finally(() => infoDialog.close());

    }
}

class LoadExportDumpDialog extends RcdMaterialModalDialog {
    constructor(result) {
        super('Load result', undefined, true, true);
        this.result = result;
    }

    init() {
        const closeCallback = () => this.close();
        const detailsCallback = () => this.displayDetails();

        let summary = '';
        let addedNodeCount = 0;
        let updatedNodeCount = 0;
        let importedBinaryCount = 0;
        let errorCount = 0;

        for (let repositoryName in this.result) {
            const repositoryDumpResult = this.result[repositoryName];
            for (let branchName in repositoryDumpResult) {
                summary += '<b>Branch [' + repositoryName + '/' + branchName + ']</b>\n';
                const branchDumpResult = repositoryDumpResult[branchName];

                summary += 'Added nodes: ' + branchDumpResult.addedNodeCount + '\n' +
                           'Updated nodes: ' + branchDumpResult.updatedNodeCount + '\n' +
                           'Imported binaries: ' + branchDumpResult.importedBinaryCount + '\n' +
                           'Errors: ' + branchDumpResult.errorCount + '\n\n';

                addedNodeCount += branchDumpResult.addedNodeCount;
                updatedNodeCount += branchDumpResult.updatedNodeCount;
                importedBinaryCount += branchDumpResult.importedBinaryCount;
                errorCount += branchDumpResult.errorCount;
            }
        }

        summary = 'Added nodes: ' + addedNodeCount + '\n' +
                  'Updated nodes: ' + updatedNodeCount + '\n' +
                  'Imported binaries: ' + importedBinaryCount + '\n' +
                  'Errors: ' + errorCount + '\n\n'
                  + summary;
        const resultItem = new RcdTextElement(summary).init();

        super.init()
            .addItem(resultItem)
            .addAction('CLOSE', closeCallback)
            .addAction('DETAILS', detailsCallback)
            .addKeyDownListener('Escape', closeCallback);
        return this;
    }

    displayDetails() {
        this.close();

        let text = '';
        for (let repositoryName in this.result) {
            const repositoryDumpResult = this.result[repositoryName];
            for (let branchName in repositoryDumpResult) {
                text += '<b>Branch [' + repositoryName + '/' + branchName + ']</b>\n';
                const branchDumpResult = repositoryDumpResult[branchName];
                text += '# added nodes: ' + branchDumpResult.addedNodeCount + '\n' +
                        '# updated nodes: ' + branchDumpResult.updatedNodeCount + '\n' +
                        '# imported binaries: ' + branchDumpResult.importedBinaryCount + '\n' +
                        '# errors: ' + branchDumpResult.errorCount + '\n' +
                        'Added nodes: ' + JSON.stringify(branchDumpResult.addedNodes, null, 2) + '\n' +
                        'Updated nodes: ' + JSON.stringify(branchDumpResult.updatedNodes, null, 2) + '\n' +
                        'Imported binaries: ' + JSON.stringify(branchDumpResult.importedBinaries, null, 2) + '\n' +
                        'Errors: ' + JSON.stringify(branchDumpResult.errors, null, 2) + '\n\n';
            }
        }

        showDetailsDialog('Load result details', text);
    }
}

class ExportResultDialog extends RcdMaterialModalDialog {
    constructor(result, type = 'node') {
        super('Export result', undefined, true, true);
        this.result = result;
        this.type = type;
    }

    init() {
        const closeCallback = () => this.close();
        const detailsCallback = () => this.displayDetails();

        let exportedNodeCount = this.result.exportedNodeCount;
        let exportedBinaryCount = this.result.exportedBinaryCount;
        let errorCount = this.result.errorCount;

        const summary = 'Exported ' + this.type + 's: ' + exportedNodeCount + '\n' +
                        'Exported binaries: ' + exportedBinaryCount + '\n' +
                        'Errors: ' + errorCount;
        const resultItem = new RcdTextElement(summary).init();

        super.init()
            .addItem(resultItem)
            .addAction('CLOSE', closeCallback)
            .addAction('DETAILS', detailsCallback)
            .addKeyDownListener('Escape', closeCallback);
        return this;
    }

    displayDetails() {
        this.close();

        let text = '';
        const exportedNodes = this.type === 'content' ? this.result.exportedNodes.map(nodePathToContentPath) : this.result.exportedNodes;

        text += '# exported ' + this.type + 's: ' + this.result.exportedNodeCount + '\n' +
                '# exported binaries: ' + this.result.exportedBinaryCount + '\n' +
                '# errors: ' + this.result.errorCount + '\n' +
                'Exported ' + this.type + 's: ' + JSON.stringify(exportedNodes, null, 2) + '\n' +
                'Exported binaries: ' + JSON.stringify(this.result.exportedBinaries, null, 2) + '\n' +
                'Errors: ' + JSON.stringify(this.result.errors, null, 2) + '\n\n';

        showDetailsDialog('Export result details', text);
    }
}

class DumpResultDialog extends RcdMaterialModalDialog {
    constructor(result, load) {
        super((load ? 'Load' : 'Dump') + ' result', undefined, true, true);
        this.result = result;
        this.load = load;
    }

    init() {
        const closeCallback = () => this.close();
        const errorsCallback = () => this.displayErrors();

        let summary = '';
        let dumpedNodeCount = 0;
        let errorCount = 0;
        for (let repositoryName in this.result) {
            const repositoryDumpResult = this.result[repositoryName];
            summary += '<b>Repository [' + repositoryName + ']</b>\n';
            for (let branchName in repositoryDumpResult) {
                const branchDumpResult = repositoryDumpResult[branchName];
                summary += 'Branch [' + branchName + ']: ' + branchDumpResult.successful +
                           ' nodes ' + (this.load ? 'loaded' : 'dumped');
                if (branchDumpResult.errorCount > 0) {
                    summary += ' and ' + branchDumpResult.errorCount + ' errors';
                }
                summary += '.\n';
                dumpedNodeCount += branchDumpResult.successful;
                errorCount += branchDumpResult.errorCount;
            }
            summary += '\n';
        }

        summary = (this.load ? 'Loaded' : 'Dumped') + ' nodes: ' + dumpedNodeCount + '\n' +
                  'Errors: ' + errorCount + '\n\n'
                  + summary;
        const resultItem = new RcdTextElement(summary).init();

        super.init().addItem(resultItem)
            .addAction('CLOSE', closeCallback)
            .addKeyDownListener('Escape', closeCallback);

        if (errorCount > 0) {
            this.addAction('ERRORS', errorsCallback);
        }

        return this;
    }

    displayErrors() {
        this.close();

        let text = '';
        for (let repositoryName in this.result) {
            const repositoryDumpResult = this.result[repositoryName];
            for (let branchName in repositoryDumpResult) {
                let branchText = '';
                if (repositoryDumpResult[branchName].errors) {
                    repositoryDumpResult[branchName].errors.forEach(error => {
                        branchText += error + '\n';
                    });
                }
                if (branchText) {
                    text += '<b>Repository/Branch [' + repositoryName + '/' + branchName + ']</b>\n' + branchText;
                }
            }
        }

        showDetailsDialog((this.load ? 'Load' : 'Dump') + ' errors', text);
    }
}

class PushResultDialog extends RcdMaterialModalDialog {
    constructor(result) {
        super('Push result', undefined, true, true);
        this.result = result;
    }

    init() {
        const closeCallback = () => this.close();
        const detailsCallback = () => this.displayDetails();

        const summary = 'Pushed nodes: ' + this.result.success.length + '\n' +
                        'Deleted nodes: ' + this.result.deleted.length + '\n' +
                        'Errors: ' + this.result.failed.length;
        const resultItem = new RcdTextElement(summary).init();

        super.init()
            .addItem(resultItem)
            .addAction('CLOSE', closeCallback)
            .addAction('DETAILS', detailsCallback)
            .addKeyDownListener('Escape', closeCallback);
        return this;
    }

    displayDetails() {
        this.close();

        let text = '';
        text += '# pushed nodes: ' + this.result.success.length + '\n' +
                '# deleted nodes: ' + this.result.deleted.length + '\n' +
                '# errors: ' + this.result.failed.length + '\n' +
                'Pushed nodes: ' + JSON.stringify(this.result.success, null, 2) + '\n' +
                'Deleted nodes: ' + JSON.stringify(this.result.deleted, null, 2) + '\n' +
                'Errors: ' + JSON.stringify(this.result.failed, null, 2) + '\n\n';

        showDetailsDialog('Export result details', text);
    }
}

class DtbExportInputDialog extends RcdMaterialInputDialog {
    constructor(params) {
        super({
            title: 'Export ' + params.type,
            label: 'Export name',
            placeholder: params.defaultValue,
            value: params.defaultValue,
            confirmationLabel: 'EXPORT',
            callback: (value) => {
                params.callback(value || params.defaultValue);
            }
        });
        this.spaceField = new RcdTextDivElement(getTextualSpaceInfo(params.dirInfo)).init().addClass('dtb-details-text');
    }

    init() {
        return super.init()
            .addItem(this.spaceField)
    }
}

function getTextualSpaceInfo(dirInfo) {
    return 'Disk space<br/>'
        + 'Used: \t\t' + getPrettifiedSize(dirInfo.total - dirInfo.usable) + '<br/>'
        + 'Usable: \t\t' + getPrettifiedSize(dirInfo.usable) + '<br/>'
        + 'Capacity: \t' + (100 * dirInfo.usable / dirInfo.total).toFixed(1) + '%';
}

function getSpaceInfo(dirInfo) {
    return getPrettifiedSize(dirInfo.usable) +' / ' + getPrettifiedSize(dirInfo.total) + ' (' + (100 * dirInfo.usable / dirInfo.total).toFixed(1) + '%)';
}

function getPrettifiedSize(byteSize) {
    if (byteSize > 1024 * 1024 * 1024) {
        return (byteSize / (1024 * 1024 * 1024)).toFixed(1) + 'GiB';
    }
    if (byteSize > 1024 * 1024) {
        return (byteSize / (1024 * 1024)).toFixed(1) + 'MiB';
    }
    if (byteSize > 1024) {
        return (byteSize / 1024).toFixed(1) + 'KiB';
    }
    return byteSize + 'B';
}

function nodePathToContentPath(nodePath) {
    if (!nodePath || !nodePath.startsWith('/content')) {
        return nodePath;
    }
    const contentPath = nodePath.substr('/content'.length);
    return contentPath === '' ? '/' : contentPath;
}

class DtbRoute extends RcdMaterialRoute {
    constructor(params) {
        super({
            state: params.state,
            name: params.name,
            iconArea: params.iconArea
        });
    }

    init() {
        const breadcrumbsLayout = this.createBreadcrumbsLayout();
        this.layout = this.createLayout();
        this.callback = (main) => {
            main.addChild(breadcrumbsLayout).addChild(this.layout);
            this.onDisplay();
        };
        this.hideCallback = () => this.onHide();
        return this;
    }

    createBreadcrumbsLayout() {
        const helpIconArea = new RcdGoogleMaterialIconArea('help', () => this.displayHelp()).init().setTooltip('Help');
        this.breadcrumbsLayout = new RcdMaterialBreadcrumbsLayout().init().addChild(helpIconArea);
        return this.breadcrumbsLayout;
    }

    createLayout() {
    }

    onDisplay() {
    }

    onHide() {
    }

    displayHelp() {

    }

    getParentPath(path) {
        path = path || getPathParameter();
        if (!path || path === '/') {
            return null;
        }
        return path.substring(0, path.lastIndexOf('/')) || '/';
    }

    getPathPrefix() {
        const path = getPathParameter();
        return path && path !== '/' ? (path + '/') : '/';
    }

    getParentProperty() {
        const property = getPropertyParameter();
        return property && property.substring(0, property.lastIndexOf('.'));
    }

    displayNodeAsJson(nodeKey) {
        const infoDialog = showShortInfoDialog("Retrieving node info...");
        return requestPostJson(config.servicesUrl + '/node-get', {
            data: {
                repositoryName: getRepoParameter(),
                branchName: getBranchParameter(),
                key: nodeKey
            }
        })
            .then((result) => {
                const formattedJson = this.formatJson(result.success);
                showDetailsDialog('Node [' + nodeKey + ']', formattedJson).addClass('node-details-dialog');
            })
            .catch(handleRequestError)
            .finally(() => infoDialog.close());
    }

    displayBlobAsJson(type, blobKey) {
        const infoDialog = showShortInfoDialog("Retrieving blob...");
        return requestPostJson(config.servicesUrl + '/blob-get', {
            data: {
                repositoryName: getRepoParameter(),
                type: type.toLowerCase(),
                blobKey: blobKey
            }
        })
            .then((result) => {
                const formattedJson = this.formatJson(result.success);
                showDetailsDialog(blobKey ? 'Blob [' + blobKey + ']' : type + ' Blob [' + versionKey + ']', formattedJson)
                    .addClass('node-details-dialog');
            })
            .catch(handleRequestError)
            .finally(() => infoDialog.close());
    }

    formatJson(value, tab = '') {
        if (value === null) {
            return '<a class=json-null>null</a>';
        } else if (value === undefined) {
            return '<a class=json-undefined>undefined</a>';
        } else if (typeof value === 'string') {
            return '<a class=json-string>"' + value + '"</a>';
        } else if (typeof value === "number") {
            return '<a class=json-number>' + value + '</a>';
        } else if (typeof value === "boolean") {
            return '<a class=json-boolean>' + value + '</a>';
        } else if (Array.isArray(value)) {
            let formattedArray = '[\n';
            for (let i = 0; i < value.length; i++) {
                const arrayElement = value[i];
                formattedArray += tab + '  ' + this.formatJson(arrayElement, tab + '  ') + (i < (value.length - 1) ? ',' : '') + '\n';
            }
            formattedArray += tab + ']';
            return formattedArray;
        } else if (typeof value === "object") {
            let formattedObject = '{\n';
            const attributeNames = Object.keys(value);
            for (let i = 0; i < attributeNames.length; i++) {
                const attributeName = attributeNames[i];
                formattedObject += tab + '  "' + attributeName + '": ' + this.formatJson(value[attributeName], tab + '  ') +
                                   (i < (attributeNames.length - 1) ? ',' : '') + '\n';
            }
            formattedObject += tab + '}';
            return formattedObject;
        } else {
            return value;
        }
    }

    doExportNode(nodePath, exportName) {
        const infoDialog = showLongInfoDialog("Exporting nodes...");
        return requestPostJson(config.servicesUrl + '/node-export', {
            data: {
                repositoryName: getRepoParameter(),
                branchName: getBranchParameter(),
                nodePath: nodePath,
                exportName: exportName
            }
        })
            .then((result) => handleTaskCreation(result, {
                taskId: result.taskId,
                message: 'Exporting nodes...',
                doneCallback: (success) => new ExportResultDialog(success).init().open(),
                alwaysCallback: () => setState('exports')
            }))
            .catch(handleRequestError)
            .finally(() => infoDialog.close());
    }

    deleteNodes(params) {
        showConfirmationDialog(params.nodeKeys.length > 1 ? 'Delete this node?' : 'Delete selected nodes?', 'DELETE',
            () => this.doDeleteNodes(params));
    }

    doDeleteNodes(params) {
        const infoDialog = showLongInfoDialog("Deleting nodes...");
        requestPostJson(config.servicesUrl + '/node-delete', {
            data: {
                repositoryName: params.repo || getRepoParameter(),
                branchName: params.branch || getBranchParameter(),
                keys: params.nodeKeys
            },
        })
            .then((result) => handleTaskCreation(result, {
                taskId: result.taskId,
                message: 'Deleting nodes...',
                doneCallback: (success) => displaySuccess(success + ' node' + (success > 1 ? 's' : '') + ' deleted'),
                alwaysCallback: params.callback ? params.callback : () => RcdHistoryRouter.refresh()
            }))
            .catch(handleRequestError)
            .finally(() => infoDialog.close());
    }

    moveNode(sources) {
        const nodeCount = sources.length;
        const pathPrefix = this.getPathPrefix();
        const title = nodeCount == 1 ? 'Move/rename node' : 'Move nodes';
        const currentValue = nodeCount == 1 ? sources[0].path : pathPrefix;
        const currentActionLabel = nodeCount == 1 ? 'RENAME' : 'MOVE';
        const currentLabel = nodeCount == 1 ? 'New name/path/parent path' : 'New parent path';
        const inputDialog = new RcdMaterialInputDialog({
            title: title,
            confirmationLabel: currentActionLabel,
            label: currentLabel,
            placeholder: '',
            value: currentValue,
            callback: (value) => isValid(value) && this.doMoveNode(sources, value)
        }).init();

        //TODO Implement clean solution. Adapt Framework
        inputDialog.addInputListener((source) => {
            const newValue = source.getValue();
            inputDialog.enable(isValid(newValue));
            if (nodeCount == 1) {
                const newActionLabel = isRename(newValue) ? 'RENAME' : 'MOVE';
                inputDialog.setConfirmationLabel(newActionLabel);
            }
        });

        function isValid(value) {
            if (!value) {
                return false;
            }
            if (nodeCount > 1 && value.slice(-1) !== '/') {
                return false;
            }
            return true;
        }

        function isRename(value) {
            if (!value) {
                return false;
            }
            if (value.startsWith(pathPrefix)) {
                const subValue = value.substr(pathPrefix.length);
                return subValue.length > 0 && subValue.indexOf('/') === -1;
            }
            return false;
        }

        inputDialog.open();
    }

    doMoveNode(sources, newNodePath) {
        const infoDialog = showLongInfoDialog("Moving nodes...");
        return requestPostJson(config.servicesUrl + '/node-move', {
            data: {
                repositoryName: getRepoParameter(),
                branchName: getBranchParameter(),
                sources: sources.map((source) => source.id),
                target: newNodePath
            }
        })
            .then((result) => handleTaskCreation(result, {
                taskId: result.taskId,
                message: 'Moving nodes...',
                doneCallback: (success) => displaySuccess('Node(s) moved'),
                alwaysCallback: sources[0].callback ? sources[0].callback() : () => RcdHistoryRouter.refresh()
            }))
            .catch(handleRequestError)
            .finally(() => infoDialog.close());
    }

    deletePrincipals(params) {
        showConfirmationDialog(params.keys.length > 1 ? 'Delete this ' + params.type + '?' : 'Delete selected ' + params.type + 's?',
            'DELETE',
            () => this.doDeletePrincipals(params));
    }

    doDeletePrincipals(params) {
        const infoDialog = showLongInfoDialog('Deleting ' + params.type + 's...');
        requestPostJson(config.servicesUrl + '/principal-delete', {
            data: {
                keys: params.keys,
                type: params.type
            },
        })
            .then((result) => handleTaskCreation(result, {
                taskId: result.taskId,
                message: 'Deleting ' + params.type + '...',
                doneCallback: (success) => displaySuccess(success + ' ' + params.type + (success > 1 ? 's' : '') + ' deleted'),
                alwaysCallback: params.callback ? params.callback : () => RcdHistoryRouter.refresh()
            }))
            .catch(handleRequestError)
            .finally(() => infoDialog.close());
    }
}

function handleTaskCreation(result, params) {
    const infoDialog = showLongInfoDialog(params.message).addClass('dt-progress-info-dialog');
    let progressIndicator;
    retrieveTaskProgress({
        taskId: params.taskId,
        doneCallback: (task) => {
            if (task) {
                let result;
                try {
                    result = JSON.parse(task.progress.info);
                } catch (e) {
                    result = {error: "Error while parsing task result: " + e.message};
                }
                if (result.error) {
                    displayError(result.error);
                } else {
                    if (params.doneCallback) {
                        params.doneCallback(result.success);
                    }
                }
            }
        },
        progressCallback: (task) => {
            infoDialog.setInfoText(task.progress.info);
            if (!progressIndicator && task.progress.total > 0) {
                progressIndicator = new RcdLinearProgressIndicator({width: 240, height: 8}).init();
                infoDialog.addItem(progressIndicator);
            }
            if (progressIndicator) {
                progressIndicator.show(task.progress.total !== 0);
                progressIndicator.setProgress(task.progress.current / task.progress.total);
            }
        },
        alwaysCallback: () => {
            infoDialog.close();
            if (params.alwaysCallback) {
                params.alwaysCallback();
            }
        }
    });
}

function retrieveTaskProgress(params) {
    let attemptCounter = 0;
    const intervalId = taskManager && taskManager.isLive() ? setInterval(() => {
        const task = taskManager.getTask(params.taskId);
        if ((task == null || task.state === 'WAITING') && attemptCounter < 9) {
            attemptCounter++;
        } else {
            onTaskRetrieved(task, params, intervalId);
        }
    }, 100) : setInterval(() => {
        requestPostJson(config.servicesUrl + '/task-get', {
            data: {
                taskId: params.taskId
            }
        }).then((result) => {
            const task = result.success;
            if ((task == null || task.state === 'WAITING') && attemptCounter < 1) {
                attemptCounter++;
            } else {
                onTaskRetrieved(task, params, intervalId);
            }
        })
            .catch((error) => {
                clearInterval(intervalId);
                handleRequestError(error);
                params.alwaysCallback();
            });
    }, 1000);
}

function onTaskRetrieved(task, params, intervalId) {
    if (task && task.state === 'FINISHED') {
        clearInterval(intervalId);
        params.doneCallback(task);
        params.alwaysCallback();
    } else if (task && task.state === 'RUNNING') {
        if (params.progressCallback) {
            params.progressCallback(task);
        }
    } else {
        clearInterval(intervalId);
        params.alwaysCallback();
    }
}

function retrieveTasks(params) {
    return new Promise((resolve, reject) => {
        if (taskManager) {
            const tasks = taskManager.getTasks(params.applicationKey);
            resolve(tasks);
        } else {
            requestJson(config.servicesUrl + '/task-list')
                .then((result) => {
                    const filteredTasks = result.success.filter(
                        task => !params.applicationKey || params.applicationKey === task.application);
                    resolve(filteredTasks);
                })
                .catch((error) => {
                    handleRequestError(error);
                    reject();
                });
        }
    });
}

function encodeReservedCharacters(text) {
    return text && text.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function requestPostXMLHttp(url, data, params) {
    const xhr = new XMLHttpRequest();
    if (params.uploadProgress) {
        xhr.upload.onprogress = params.uploadProgress;
    }
    if (params.onloadend) {
        xhr.onloadend = params.onloadend;
    }
    xhr.onerror = () => displayError('Request error');
    xhr.onload = () => {
        if (xhr.status === 200) {
            const result = JSON.parse(xhr.responseText);
            if (result.error) {
                displayError(result.error);
            } else {
                if (params.callback) {
                    params.callback(result);
                }
            }
        } else {
            displayError('Error ' + xhr.status + ': ' + xhr.statusText);
        }
    };
    xhr.open('POST', url, true);
    xhr.send(data);
}

function displaySuccess(text) {
    console.info(text);
    displaySnackbar(text);
}

function displayError(text, parent) {
    console.error(text);
    displaySnackbar(text, parent);
}

function displaySnackbar(text, parent) {
    new RcdMaterialSnackbar(text)
        .init()
        .open(parent);
}

function parseJson(value) {
    try {
        return JSON.parse(value);
    } catch (value) {
        return null;
    }
}

function toHumanReadableSize(sizeInBytes) {
    if (sizeInBytes < 1024) {
        return sizeInBytes + ' B';
    }
    if (sizeInBytes < 1024 * 1024) {
        return (sizeInBytes / 1024).toFixed(1) + ' KiB';
    }
    if (sizeInBytes < 1024 * 1024 * 1024) {
        return (sizeInBytes / (1024 * 1024)).toFixed(1) + ' MiB';
    }
    return (sizeInBytes / (1024 * 1024 * 1024)).toFixed(1) + ' GiB'
}

class DtbCheckboxField extends RcdDivElement {
    constructor(params) {
        super();
        this.checkbox = new RcdMaterialCheckbox().init()
            .select(true)
            .addClickListener(params.callback);
        this.label = new RcdTextDivElement(params.label)
            .init()
            .addClass('dtb-checkbox-label');
    }

    init() {
        return super.init()
            .addClass('dtb-checkbox-field')
            .addChild(this.checkbox)
            .addChild(this.label);
    }

    isSelected() {
        return this.checkbox.isSelected();
    }

    select(select) {
        this.checkbox.select(select);
        return this;
    }
}

function isEqualArray(array1, array2) {
    if (array1.length !== array2.length) {
        return false;
    }
    for (const elementArray1 of array1) {
        if (array2.indexOf(elementArray1) === -1) {
            return false;
        }
    }
    return true;
}