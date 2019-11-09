class ExportsRoute extends DtbRoute {
    constructor() {
        super({
            state: 'exports',
            name: 'Node Exports',
            iconArea: new RcdGoogleMaterialIconArea('import_export').init()
        });
    }

    onDisplay() {
        this.retrieveExports();
    }
    
    createBreadcrumbsLayout() {
        return new RcdMaterialBreadcrumbsLayout().init().
            addBreadcrumb(new RcdMaterialBreadcrumb('Data Toolbox').init().setStateRef('')).
            addBreadcrumb(new RcdMaterialBreadcrumb('Node exports').init()).
            addChild(new RcdGoogleMaterialIconArea('help', () => this.displayHelp()).init().setTooltip('Help'));
    }
    
    createLayout() {
        this.tableCard = new RcdMaterialTableCard('Node exports').init().
            addColumn('Export name').
            addColumn('Timestamp', {classes: ['non-mobile-cell']}).
            addIconArea(new RcdGoogleMaterialIconArea('file_download',
                () => this.dowloadExports()).init().setTooltip('Archive and download selected node exports'),
                {min: 1}).
            addIconArea(new RcdGoogleMaterialIconArea('file_upload', () => this.uploadExports()).init().setTooltip('Upload and unarchive node exports', RcdMaterialTooltipAlignment.RIGHT), {max: 0}).
            addIconArea(new RcdGoogleMaterialIconArea('delete', () => this.deleteExports()).init().setTooltip('Delete selected node exports', RcdMaterialTooltipAlignment.RIGHT), {min: 1});
        return new RcdMaterialLayout().init().
            addChild(this.tableCard);
    }

    retrieveExports() {
        const infoDialog = showShortInfoDialog('Retrieving export list...');
        return $.ajax({
            url: config.servicesUrl + '/export-list'
        }).done((result) => {
            this.tableCard.deleteRows();
            if (handleResultError(result)) {
                result.success.sort((export1, export2) => export2.timestamp - export1.timestamp).
                forEach((anExport) => {
                    this.tableCard.createRow().
                        addCell(anExport.name).
                        addCell(toLocalDateTimeFormat(new Date(anExport.timestamp)), {classes: ['non-mobile-cell']}).
                        setAttribute('export', anExport.name);
                });
            }
        }).fail(handleAjaxError).always(() => {
            infoDialog.close();
        });
    }

    deleteExports() {
        showConfirmationDialog('Delete selected exports?', 'DELETE', () => this.doDeleteExports());
    }

    doDeleteExports() {
        const infoDialog = showLongInfoDialog("Deleting exports...");
        const exportNames = this.tableCard.getSelectedRows().map((row) => row.attributes['export']);
        $.ajax({
            method: 'POST',
            url: config.servicesUrl + '/export-delete',
            data: JSON.stringify({exportNames: exportNames}),
            contentType: 'application/json; charset=utf-8'
        }).done((result) => handleTaskCreation(result, {
            taskId: result.taskId,
            message: 'Deleting exports...',
            doneCallback: () => displaySnackbar('Export' + (exportNames.length > 1 ? 's' : '') + ' deleted'),
            alwaysCallback: () => this.retrieveExports()
        })).fail(handleAjaxError).always(() => {
            infoDialog.close();
        });
    }

    dowloadExports() {
        const exportNames = this.tableCard.getSelectedRows().map((row) => row.attributes['export']);
        const infoDialog = showLongInfoDialog("Archiving exports...");
        $.ajax({
            method: 'POST',
            url: config.servicesUrl + '/export-archive',
            data: JSON.stringify({exportNames: exportNames}),
            contentType: 'application/json; charset=utf-8'
        }).done((result) => handleTaskCreation(result, {
            taskId: result.taskId,
            message: 'Archiving exports...',
            doneCallback: (success) => {
                const archiveNameInput = new RcdInputElement().init().
                setAttribute('type', 'hidden').
                setAttribute('name', 'archiveName').
                setAttribute('value', success);
                const fileNameInput = new RcdInputElement().init().
                setAttribute('type', 'hidden').
                setAttribute('name', 'fileName').
                setAttribute('value', (exportNames.length == 1 ? exportNames[0] : "export-download") + '.zip');
                const downloadForm = new RcdFormElement().init().
                setAttribute('action', config.servicesUrl + '/export-download').
                setAttribute('method', 'post').
                addChild(archiveNameInput).
                addChild(fileNameInput);
                document.body.appendChild(downloadForm.domElement);
                downloadForm.submit();
                document.body.removeChild(downloadForm.domElement);
            }
        })).fail(handleAjaxError).always(() => {
            infoDialog.close();
        });
    }

    uploadExports() {
        const uploadFileInput = new RcdInputElement().init().
            setAttribute('type', 'file').
            setAttribute('name', 'uploadFile').
            addChangeListener(() => this.doUploadExports());
        this.uploadForm = new RcdFormElement().init().
            addChild(uploadFileInput);
        uploadFileInput.click();
    }

    doUploadExports() {
        const infoDialog = showLongInfoDialog("Uploading exports...");
        const formData = new FormData(this.uploadForm.domElement);
        $.ajax({
            method: 'POST',
            url: config.servicesUrl + '/export-upload',
            data: formData,
            contentType: false,
            processData: false
        }).done((result) => handleTaskCreation(result, {
            taskId: result.taskId,
            message: 'Uploading exports...',
            doneCallback: () => displaySnackbar('Export(s) uploaded'),
            alwaysCallback: () => this.retrieveExports()
        })).fail(handleAjaxError).always(() => {
            infoDialog.close();
        });
    }

    displayHelp() {
        const definition = 'A node export is a serialization of a given content/node and its children. ' +
                           'This makes node exports well suited for transferring a specific content to another installation. ' +
                           'Warning: The export mechanism does not export old versions of your data. You will loose the version history of your contents. ' +
                           'See <a class="rcd-material-link" href="http://xp.readthedocs.io/en/6.11/operations/export.html">Export and Import</a> for more information.';

        const viewDefinition = 'The view lists in a table all the node exports located in $XP_HOME/data/export. ' +
                               'You can delete or archive (ZIP) and download existing exports. ' +
                               'You can also upload previously archived exports.<br/>' +
                               'Node exports can be generated and imported from the nodes view (Under "Repositories").';

        new HelpDialog('Node Exports', [definition, viewDefinition]).
            init().
            addActionDefinition({iconName: 'file_download', definition: 'Zip the selected exports and download the archive'}).
            addActionDefinition({iconName: 'file_upload', definition: 'Upload archived exports and unzip them into $XP_HOME/data/export'}).
            addActionDefinition({iconName: 'delete', definition: 'Delete the selected node exports.'}).
            open();
    }
}
