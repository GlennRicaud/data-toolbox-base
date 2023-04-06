class DtbDumpInputDialog extends RcdMaterialInputDialog {
    constructor(params) {
        super({
            title: 'Create dump',
            label: 'Dump name',
            placeholder: params.defaultValue,
            value: params.defaultValue,
            confirmationLabel: 'CREATE',
            callback: (value) => {
                params.callback({
                    name: value || params.defaultValue,
                    includeVersions: this.includeVersionsField.isSelected(),
                    archive: this.archiveField.isSelected(),
                    maxVersions: this.includeVersionsField.isSelected() && this.maxVersionsField.getValue()
                                 ? Number(this.maxVersionsField.getValue()) : undefined,
                    maxVersionsAge: this.includeVersionsField.isSelected() && this.maxVersionsAgeField.getValue()
                                    ? Number(this.maxVersionsAgeField.getValue()) : undefined
                });
            }
        });
        
        this.includeVersionsField = new DtbCheckboxField({
            label: 'Include version history',
            callback: () => {
                const includeVersion = !this.includeVersionsField.isSelected();
                this.includeVersionsField.select(includeVersion);
                this.maxVersionsField.show(includeVersion);
                this.maxVersionsAgeField.show(includeVersion);
                this.checkValidity();
            }
        }).init();
        
        this.archiveField = new DtbCheckboxField({
            label: 'Archive system dump',
            callback: () => {
                const archive = !this.archiveField.isSelected();
                this.archiveField.select(archive);
            }
        }).init();

        this.maxVersionsField = new RcdMaterialTextField('', 'Max. number of versions (opt.)')
            .init()
            .setPattern('[0-9]*')
            .addInputListener(() => this.checkValidity());

        this.maxVersionsAgeField = new RcdMaterialTextField('', 'Max. age of versions (days) (opt.)')
            .init()
            .setPattern('[0-9]*')
            .addInputListener(() => this.checkValidity());

        this.spaceField = new RcdTextDivElement(getTextualSpaceInfo(params.dirInfo)).init().addClass('dtb-details-text');
    }

    init() {
        return super.init()
            .addItem(this.includeVersionsField)
            .addItem(this.archiveField)
            .addItem(this.spaceField)
    }

    checkValidity() {
        this.enable(this.isValid());
        return this;
    }

    isValid() {
        if (this.includeVersionsField.isSelected()) {
            if (!this.maxVersionsField.checkValidity()) {
                return false;
            }
            if (!this.maxVersionsAgeField.checkValidity()) {
                return false;
            }
        }
        return true;
    }
}

class DumpsRoute extends DtbRoute {
    constructor() {
        super({
            state: 'dumps',
            name: 'System Dumps',
            iconArea: new RcdImageIconArea(config.assetsUrl + '/icons/dump.svg').init()
        });
    }

    onDisplay() {
        this.retrieveDumps();
    }

    createBreadcrumbsLayout() {
        return new RcdMaterialBreadcrumbsLayout().init()
            .addBreadcrumb(new RcdMaterialBreadcrumb('Data Toolbox').init().setStateRef(''))
            .addBreadcrumb(new RcdMaterialBreadcrumb('System dumps').init())
            .addChild(new RcdGoogleMaterialIconArea('help', () => this.displayHelp()).init().setTooltip('Help'));
    }

    createLayout() {
        this.tableCard = new RcdMaterialTableCard('System dumps')
            .init()
            .addColumn('Dump name')
            .addColumn('Timestamp<br/>Size', {classes: ['non-mobile-cell']})
            .addColumn('Model Version<br/>Creator (XP Version)', {classes: ['non-mobile-cell', 'version-cell']})
            .addIconArea(new RcdGoogleMaterialIconArea('add_circle', () => this.createDump())
                    .init()
                    .setTooltip('Generate a system dump'),
                {max: 0})
            .addIconArea(new RcdGoogleMaterialIconArea('update', () => this.upgradeDump())
                    .init()
                    .setTooltip('Upgrade selected system dump'),
                {
                    min: 1, max: 1, predicate: () => {
                        const dumpType = this.tableCard.getSelectedRows().map((row) => row.attributes['type'])[0];
                        const canLoad = this.tableCard.getSelectedRows().map((row) => row.attributes['canLoad'])[0];
                        return 'versioned' === dumpType && !canLoad;
                    }
                })
            .addIconArea(new RcdImageIconArea(config.assetsUrl + '/icons/load.svg', () => this.loadDump())
                    .init()
                    .setTooltip('Load selected system dump'),
                {
                    min: 1, max: 1, predicate: () => {
                        const canLoad = this.tableCard.getSelectedRows().map((row) => row.attributes['canLoad'])[0];
                        return canLoad;
                    }
                })
            .addIconArea(new RcdGoogleMaterialIconArea('file_download', () => this.downloadDump())
                .init()
                .setTooltip('Download selected system dump'), {min: 1, max: 1})
            .addIconArea(new RcdGoogleMaterialIconArea('file_upload', () => this.uploadDump())
                .init()
                .setTooltip('Upload system dump', RcdMaterialTooltipAlignment.RIGHT), {max: 0})
            .addIconArea(new RcdGoogleMaterialIconArea('delete', () => this.deleteDumps())
                .init()
                .setTooltip('Delete selected system dumps', RcdMaterialTooltipAlignment.RIGHT), {min: 1});
        return new RcdMaterialLayout().init()
            .addChild(this.tableCard);
    }

    retrieveDumps() {
        const infoDialog = showShortInfoDialog('Retrieving dump list...');
        this.tableCard.deleteRows();
        return requestJson(config.servicesUrl + '/dump-list')
            .then((result) => {
                result.success.sort((dump1, dump2) => dump2.timestamp - dump1.timestamp)
                    .forEach((dump) => {
                        this.tableCard.createRow()
                            .addCell(dump.name)
                            .addCell(toLocalDateTimeFormat(new Date(dump.timestamp))
                                     + (dump.size >= 0 ? '<br/>' + toHumanReadableSize(dump.size) : ''),
                                {classes: ['non-mobile-cell']})
                            .addCell(dump.modelVersion + '<br/>' + dump.xpVersion, {classes: ['non-mobile-cell', 'version-cell']})
                            .setAttribute('dump', dump.name)
                            .setAttribute('type', dump.type)
                            .setAttribute('canLoad', dump.canLoad);
                    });
            })
            .catch(handleRequestError)
            .finally(() => infoDialog.close());
    }

    createDump() {
        const infoDialog = showShortInfoDialog('Retrieving home information...');
        return requestJson(config.servicesUrl + '/home')
            .then((result) => {
                const defaultDumpName = 'dump-' + toLocalDateTimeFormat(new Date(), '-', '-');
                new DtbDumpInputDialog({
                    defaultValue: defaultDumpName,
                    dirInfo: result.success.dump,
                    callback: (value) => this.doCreateDump(value)
                }).init().open();

            })
            .catch(handleRequestError)
            .finally(() => infoDialog.close());
    }

    doCreateDump(params) {
        const infoDialog = showLongInfoDialog('Creating dump...');
        requestPostJson(config.servicesUrl + '/dump-create', {
            data: {
                dumpName: params.name || ('dump-' + toLocalDateTimeFormat(new Date(), '-', '-')),
                includeVersions: params.includeVersions,
                archive: params.archive,
                maxVersions: params.maxVersions,
                maxVersionsAge: params.maxVersionsAge,
            }
        })
            .then((result) => handleTaskCreation(result, {
                taskId: result.taskId,
                message: 'Creating dump...',
                doneCallback: (success) => new DumpResultDialog(success).init().open(),
                alwaysCallback: () => this.retrieveDumps()
            }))
            .catch(handleRequestError)
            .finally(() => infoDialog.close());
    }

    deleteDumps() {
        showConfirmationDialog('Delete selected dumps?', 'DELETE', () => this.doDeleteDumps());
    }

    doDeleteDumps() {
        const infoDialog = showLongInfoDialog("Deleting dumps...");
        const dumpNames = this.tableCard.getSelectedRows().map((row) => row.attributes['dump']);
        requestPostJson(config.servicesUrl + '/dump-delete', {
            data: {dumpNames: dumpNames}
        })
            .then((result) => handleTaskCreation(result, {
                taskId: result.taskId,
                message: 'Deleting dumps...',
                doneCallback: () => displaySuccess('Dump' + (dumpNames.length > 1 ? 's' : '') + ' deleted'),
                alwaysCallback: () => this.retrieveDumps()
            }))
            .catch(handleRequestError)
            .finally(() => infoDialog.close());
    }

    upgradeDump() {
        const dumpName = this.tableCard.getSelectedRows().map((row) => row.attributes['dump'])[0];
        const dumpType = this.tableCard.getSelectedRows().map((row) => row.attributes['type'])[0];
        if ('versioned' === dumpType) {
            showConfirmationDialog('Upgrading this dump will modify the existing dump and cannot be reverted', 'UPGRADE',
                () => this.doUpgradeDump(dumpName));
        }
    }

    doUpgradeDump(dumpName) {
        const infoDialog = showLongInfoDialog("Upgrading dump...");
        requestPostJson(config.servicesUrl + '/dump-upgrade', {
            data: {dumpName: dumpName}
        })
            .then((result) => handleTaskCreation(result, {
                taskId: result.taskId,
                message: 'Upgrading dump...',
                doneCallback: () => displaySuccess('Dump upgraded'),
                alwaysCallback: () => this.retrieveDumps()
            }))
            .catch(handleRequestError)
            .finally(() => infoDialog.close());
    }

    loadDump() {
        const dumpName = this.tableCard.getSelectedRows().map((row) => row.attributes['dump'])[0];
        const dumpType = this.tableCard.getSelectedRows().map((row) => row.attributes['type'])[0];
        if ('export' === dumpType) {
            this.doLoadDump(dumpName, dumpType);
        } else {
            showConfirmationDialog('Loading this dump will delete all existing repositories', 'LOAD',
                () => this.doLoadDump(dumpName, dumpType));
        }
    }

    doLoadDump(dumpName, dumpType) {
        const infoDialog = showLongInfoDialog("Loading dump...");
        requestPostJson(config.servicesUrl + '/dump-load', {
            data: {dumpName: dumpName}
        })
            .then((result) => handleTaskCreation(result, {
                taskId: result.taskId,
                message: 'Loading dump...',
                doneCallback: (success) => {
                    if (dumpType === 'export') {
                        new LoadExportDumpDialog(success).init().open();
                    } else {
                        new DumpResultDialog(success, true).init().open();
                    }
                }
            }))
            .catch(handleRequestError)
            .finally(() => infoDialog.close());
    }

    downloadDump() {
        const dumpInfo = this.tableCard.getSelectedRows().map((row) => {
            return {
                name: row.attributes['dump'],
                type: row.attributes['type']
            }
        })[0];

        if (dumpInfo.type === 'archived') {
            this.directDownloadDump(dumpInfo);
        } else {
            this.archiveAndDownloadDump(dumpInfo);
        }
    }

    directDownloadDump(dumpInfo) {
        const archiveNameInput = new RcdInputElement().init()
            .setAttribute('type', 'hidden')
            .setAttribute('name', 'archiveName')
            .setAttribute('value', dumpInfo.name);
        const fileNameInput = new RcdInputElement().init()
            .setAttribute('type', 'hidden')
            .setAttribute('name', 'fileName')
            .setAttribute('value', dumpInfo.name);
        const downloadForm = new RcdFormElement().init()
            .setAttribute('action', config.servicesUrl + '/dump-directdownload')
            .setAttribute('method', 'post')
            .addChild(archiveNameInput)
            .addChild(fileNameInput);
        document.body.appendChild(downloadForm.domElement);
        downloadForm.submit();
        document.body.removeChild(downloadForm.domElement);
    }

    archiveAndDownloadDump(dumpInfo) {
        const infoDialog = showLongInfoDialog("Archiving dump...");
        requestPostJson(config.servicesUrl + '/dump-archive', {
            data: {dumpNames: [dumpInfo.name]}
        })
            .then((result) => handleTaskCreation(result, {
                taskId: result.taskId,
                message: 'Archiving dump...',
                doneCallback: (success) => {
                    const archiveNameInput = new RcdInputElement().init().setAttribute('type', 'hidden').setAttribute('name',
                        'archiveName').setAttribute('value', success);
                    const fileNameInput = new RcdInputElement().init().setAttribute('type', 'hidden').setAttribute('name',
                        'fileName').setAttribute('value', dumpInfo.name + '.zip');
                    const downloadForm = new RcdFormElement().init().setAttribute('action', config.servicesUrl +
                                                                                            '/dump-download').setAttribute(
                        'method', 'post').addChild(archiveNameInput).addChild(fileNameInput);
                    document.body.appendChild(downloadForm.domElement);
                    downloadForm.submit();
                    document.body.removeChild(downloadForm.domElement);
                }
            }))
            .catch(handleRequestError)
            .finally(() => infoDialog.close());
    }

    uploadDump() {
        const uploadFileInput = new RcdInputElement().init()
            .setAttribute('type', 'file')
            .setAttribute('name', 'uploadFile')
            .addChangeListener(() => this.doUploadDump());
        this.uploadForm = new RcdFormElement().init()
            .addChild(uploadFileInput);
        uploadFileInput.click();
    }

    doUploadDump() {
        const infoDialog = showLongInfoDialog("Uploading dump...");
        const formData = new FormData(this.uploadForm.domElement);
        requestJson(config.servicesUrl + '/dump-directupload', {
            method: 'POST',
            body: formData
        })
            .then((result) => displaySuccess('Dump uploaded'))
            .catch(handleRequestError)
            .finally(() => {
                this.retrieveDumps();
                infoDialog.close()
            });
    }

    displayHelp() {
        const definition = 'A system dump is an export of your entire data (contents, users, groups, roles, ...) from your Enonic XP server to a serialized format.<br/>' +
                           'While a node/content export focuses on a given node and its children, a system dump is used to export an entire system (all repositories/branches/nodes). ' +
                           'This makes dumps well suited for migrating your data to another installation.<br/>' +
                           'Warning: System dumps generated by Enonic XP <6.11 are similar to exports. They contain only the latest version of the nodes and loading these system dumps will keep or overwrite existing data. ' +
                           'System dumps generated by Enonic XP >=6.11 are similar to backups. They contain the version history of the nodes and loading these system dumps will delete existing data.<br/>' +
                           'See <a class="rcd-material-link" href="https://developer.enonic.com/docs/xp/stable/deployment/data#dump_and_load">Dump & load</a> for more information.';

        const viewDefinition = 'The view lists in a table all the system dumps located in $XP_HOME/data/dump. ' +
                               'You can delete, load or archive (ZIP) and download existing dumps. ' +
                               'You can also generate a new dump of your system or upload previously downloaded dumps.';

        new HelpDialog('System Dumps', [definition, viewDefinition]).init()
            .addActionDefinition({iconName: 'add_circle', definition: 'Generate a system dump into $XP_HOME/data/dump/[dump-name]'})
            .addActionDefinition({iconName: 'refresh', definition: 'Load the selected system dumps into Enonic XP'})
            .addActionDefinition(
                {iconName: 'file_download', definition: 'Archive the selected dump, if necessary, and download the archive'})
            .addActionDefinition({iconName: 'file_upload', definition: 'Upload an archived dump into $XP_HOME/data/dump'})
            .addActionDefinition({iconName: 'delete', definition: 'Delete the selected system dumps.'})
            .open();
    }

}
