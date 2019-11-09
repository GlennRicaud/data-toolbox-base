//
class HelpDialog extends RcdMaterialModalDialog {
    constructor(viewName, definitions = []) {
        super('Help: ' + viewName + ' view', undefined, true, true);
        this.definitions = definitions;
    }

    init() {
        const closeCallback = () => this.close();
        super.init().addAction('CLOSE', closeCallback).addKeyUpListener('Enter', closeCallback).addKeyUpListener('Escape', closeCallback);

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

        super.init().addItem(resultItem).addAction('CLOSE', closeCallback).addAction('DETAILS', detailsCallback).addKeyUpListener('Enter',
            detailsCallback).addKeyUpListener('Escape', closeCallback);
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

        super.init().addItem(resultItem).addAction('CLOSE', closeCallback).addAction('DETAILS', detailsCallback).addKeyUpListener('Enter',
            detailsCallback).addKeyUpListener('Escape', closeCallback);
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

        super.init().addItem(resultItem).addAction('CLOSE', closeCallback).addAction('DETAILS', detailsCallback).addKeyUpListener('Enter',
            detailsCallback).addKeyUpListener('Escape', closeCallback);
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

        super.init().addItem(resultItem).addAction('CLOSE', closeCallback).addKeyUpListener('Escape', closeCallback);

        if (errorCount > 0) {
            this.addAction('ERRORS', errorsCallback).addKeyUpListener('Enter', errorsCallback);
        } else {
            this.addKeyUpListener('Enter', closeCallback);
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
        }
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
        return $.ajax({
            method: 'POST',
            url: config.servicesUrl + '/node-get',
            data: JSON.stringify({
                repositoryName: getRepoParameter(),
                branchName: getBranchParameter(),
                key: nodeKey
            }),
            contentType: 'application/json; charset=utf-8'
        }).done((result) => {
            if (handleResultError(result)) {
                const formattedJson = this.formatJson(result.success, '');
                showDetailsDialog('Node [' + nodeKey + ']', formattedJson).addClass('node-details-dialog');
            }
        }).fail(handleAjaxError).always(() => {
            infoDialog.close();
        });
    }

    displayBlobAsJson(type, blobKey) {
        const infoDialog = showShortInfoDialog("Retrieving blob...");
        return $.ajax({
            method: 'POST',
            url: config.servicesUrl + '/blob-get',
            data: JSON.stringify({
                repositoryName: getRepoParameter(),
                type: type.toLowerCase(),
                blobKey: blobKey
            }),
            contentType: 'application/json; charset=utf-8'
        }).done((result) => {
            if (handleResultError(result)) {
                const formattedJson = this.formatJson(result.success, '');
                showDetailsDialog(blobKey ? 'Blob [' + blobKey + ']' : type + ' Blob [' + versionKey + ']', formattedJson)
                    .addClass('node-details-dialog');
            }
        }).fail(handleAjaxError).always(() => {
            infoDialog.close();
        });
    }

    formatJson(value, tab) {
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
        return $.ajax({
            method: 'POST',
            url: config.servicesUrl + '/node-export',
            data: JSON.stringify({
                repositoryName: getRepoParameter(),
                branchName: getBranchParameter(),
                nodePath: nodePath,
                exportName: exportName
            }),
            contentType: 'application/json; charset=utf-8'
        }).done((result) => handleTaskCreation(result, {
            taskId: result.taskId,
            message: 'Exporting nodes...',
            doneCallback: (success) => new ExportResultDialog(success).init().open(),
            alwaysCallback: () => setState('exports')
        })).fail(handleAjaxError).always(() => {
            infoDialog.close();
        });
    }

    deleteNodes(params) {
        showConfirmationDialog(params.nodeKeys.length > 1 ? 'Delete this node?' : 'Delete selected nodes?', 'DELETE',
            () => this.doDeleteNodes(params));
    }

    doDeleteNodes(params) {
        const infoDialog = showLongInfoDialog("Deleting nodes...");
        $.ajax({
            method: 'POST',
            url: config.servicesUrl + '/node-delete',
            data: JSON.stringify({
                repositoryName: getRepoParameter(),
                branchName: getBranchParameter(),
                keys: params.nodeKeys
            }),
            contentType: 'application/json; charset=utf-8'
        }).done((result) => handleTaskCreation(result, {
            taskId: result.taskId,
            message: 'Deleting nodes...',
            doneCallback: (success) => displaySnackbar(success + ' node' + (success > 1 ? 's' : '') + ' deleted'),
            alwaysCallback: params.callback ? params.callback : () => RcdHistoryRouter.refresh()
        })).fail(handleAjaxError).always(() => {
            infoDialog.close();
        });
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
        return $.ajax({
            method: 'POST',
            url: config.servicesUrl + '/node-move',
            data: JSON.stringify({
                repositoryName: getRepoParameter(),
                branchName: getBranchParameter(),
                sources: sources.map((source) => source.id),
                target: newNodePath
            }),
            contentType: 'application/json; charset=utf-8'
        }).done((result) => handleTaskCreation(result, {
            taskId: result.taskId,
            message: 'Moving nodes...',
            doneCallback: (success) => displaySnackbar('Node(s) moved'),
            alwaysCallback: sources[0].callback ? sources[0].callback() : () => RcdHistoryRouter.refresh()
        })).fail(handleAjaxError).always(() => {
            infoDialog.close();
        });
    }
}

function handleTaskCreation(result, params) {
    if (handleResultError(result)) {
        const infoDialog = showLongInfoDialog(params.message).addClass('dt-progress-info-dialog');
        let progressIndicator;
        retrieveTask({
            taskId: params.taskId,
            doneCallback: (task) => {
                if (task) {
                    let result;
                    try {
                        result = JSON.parse(task.progress.info);
                    } catch (e) {
                        result = {error: "Error while parsing task result: " + e.message};
                    }
                    if (handleResultError(result)) {
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
}

function retrieveTask(params) {
    const intervalId = setInterval(() => {
        $.ajax({
            method: 'GET',
            url: config.adminRestUrl + '/tasks/' + params.taskId,
            contentType: 'application/json; charset=utf-8'
        }).done((task) => {
            if (!task || task.state === 'FINISHED') {
                clearInterval(intervalId);
                params.doneCallback(task);
                params.alwaysCallback();
            } else if (!task || task.state === 'RUNNING') {

                if (params.progressCallback) {
                    params.progressCallback(task);
                }
            } else {
                clearInterval(intervalId);
                params.alwaysCallback();
            }
        }).fail((jqXHR, textStatus, errorThrown) => {
            clearInterval(intervalId);
            handleAjaxError(jqXHR, textStatus, errorThrown);
            params.alwaysCallback();
        });
    }, 1000);
}

function encodeReservedCharacters(text) {
    return text && text.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}