(function () {
    //@widgetWorkAround@
    //@widgetWorkAround2@
    let tableCard;
    let exportWidgetContainer;
    const interval = setInterval(() => {
        exportWidgetContainer = document.getElementById('exportWidgetContainer');
        if (exportWidgetContainer && exportWidgetContainer.childNodes.length === 0) {
            clearInterval(interval);
            tableCard = new RcdMaterialTableCard('Exports').init().
                addColumn('Export name').
                addIconArea(new RcdImageIconArea(config.assetsUrl + '/icons/export-icon.svg',
                    createExport).init().setTooltip('Export current content'), config.contentPath === '/'? {min:1,max: 0}: {max: 0}).
                addIconArea(new RcdImageIconArea(config.assetsUrl + '/icons/import-icon.svg',
                    loadExports).init().setTooltip('Import selected exports'), {min: 1}).
                addIconArea(new RcdGoogleMaterialIconArea('file_download',
                    dowloadExports).init().setTooltip('Archive and download selected exports', RcdMaterialTooltipAlignment.RIGHT), {min: 1}).
                addIconArea(new RcdGoogleMaterialIconArea('file_upload', uploadExports).init().setTooltip('Upload and unarchive exports',
                    RcdMaterialTooltipAlignment.RIGHT),
                {max: 0}).
                addIconArea(new RcdGoogleMaterialIconArea('delete', deleteExports).init().setTooltip('Delete selected exports'), {min: 1}).
                addIconArea(new RcdGoogleMaterialIconArea('help', displayHelp).init().setTooltip('Help'),
                {max: 0});

            retrieveExports();
            tableCard.setParent(exportWidgetContainer);
        }
    }, 200);

    function retrieveExports() {
        const infoDialog = showShortInfoDialog('Retrieving export list...', exportWidgetContainer);
        return $.ajax({
            url: config.servicesUrl + '/export-list'
        }).done(function (result) {
            tableCard.deleteRows();
            if (handleResultError(result)) {
                result.success.sort((export1, export2) => export2.timestamp - export1.timestamp).
                    forEach((anExport) => {
                        tableCard.createRow().
                            addCell(anExport.name).
                            setAttribute('export', anExport.name);
                    });
            }
        }).fail(handleAjaxError).always(() => {
            infoDialog.close();
        });
    }

    function createExport() {
        const defaultExportName = config.contentName + '-draft-' + toLocalDateTimeFormat(new Date(), '-', '-');
        showInputDialog({
            title: "Export content",
            confirmationLabel: "CREATE",
            label: "Export name",
            placeholder: defaultExportName,
            value: defaultExportName,
            callback: (value) => doCreateExport(value || defaultExportName)
        });
    }

    function doCreateExport(exportName) {
        const infoDialog = showLongInfoDialog("Exporting content...");
        return $.ajax({
            method: 'POST',
            url: config.servicesUrl + '/export-create',
            data: JSON.stringify({
                cmsRepositoryShortName: config.cmsRepositoryShortName,
                branchName: config.branchName,
                contentPath: config.contentPath,
                exportName: exportName
            }),
            contentType: 'application/json; charset=utf-8'
        }).done((result) => handleTaskCreation(result, {
            taskId: result.taskId,
            message: 'Exporting content...',
            doneCallback: (success) =>  new ExportResultDialog(success, 'content').init().open(),
            alwaysCallback: () => retrieveExports()
        })).fail(handleAjaxError).always(() => {
            infoDialog.close();
        });
    }

    function loadExports() {
        showInputDialog({
            title: "Import contents under",
            confirmationLabel: "Import",
            label: "Content path",
            placeholder: 'Target parent content path',
            value: config.contentPath,
            callback: (value) => doLoadExports(value || '/')
        });
    }

    function doLoadExports(contentPath) {
        const infoDialog = showLongInfoDialog("Importing contents...");
        const exportNames = tableCard.getSelectedRows().
            map((row) => row.attributes['export']);
        return $.ajax({
            method: 'POST',
            url: config.servicesUrl + '/export-load',
            data: JSON.stringify({
                cmsRepositoryShortName: config.cmsRepositoryShortName,
                branchName: config.branchName,
                contentPath: contentPath,
                exportNames: exportNames
            }),
            contentType: 'application/json; charset=utf-8'
        }).done((result) => handleTaskCreation(result, {
            taskId: result.taskId,
            message: 'Importing contents...',
            doneCallback: (success) =>  new ImportResultDialog(exportNames, success, 'content').init().open(),
            alwaysCallback: () => retrieveExports()
        })).fail(handleAjaxError).always(() => {
            infoDialog.close();
        });
    }

    function deleteExports() {
        showConfirmationDialog("Delete selected exports?", 'DELETE', doDeleteExports);
    }

    function doDeleteExports() {
        const infoDialog = showLongInfoDialog("Deleting exports...",);
        const exportNames = tableCard.getSelectedRows().map((row) => row.attributes['export']);
        $.ajax({
            method: 'POST',
            url: config.servicesUrl + '/export-delete',
            data: JSON.stringify({exportNames: exportNames}),
            contentType: 'application/json; charset=utf-8'
        }).done((result) => handleTaskCreation(result, {
            taskId: result.taskId,
            message: 'Deleting exports...',
            doneCallback: () => displaySnackbar('Export' + (exportNames.length > 1 ? 's' : '') + ' deleted'),
            alwaysCallback: () => retrieveExports()
        })).fail(handleAjaxError).always(() => {
            infoDialog.close();
        });
    }

    function dowloadExports() {
        const exportNames = tableCard.getSelectedRows().map((row) => row.attributes['export']);
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

    var uploadForm;

    function uploadExports() {
        const uploadFileInput = new RcdInputElement().init().
            setAttribute('type', 'file').
            setAttribute('name', 'uploadFile').
            addChangeListener(doUploadExports);
        uploadForm = new RcdFormElement().init().
            addChild(uploadFileInput);
        uploadFileInput.click();
    }

    function doUploadExports() {
        const infoDialog = showLongInfoDialog("Uploading exports...");
        const formData = new FormData(uploadForm.domElement);
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
            alwaysCallback: () => retrieveExports()
        })).fail(handleAjaxError).always(() => {
            infoDialog.close();
        });
    }

    function displayHelp() {
        const definition = 'A content export is a serialization of a given content and its children. ' +
                           'This makes content exports well suited for transferring a specific content to another installation. ' +
                           'Warning: The export mechanism does not export old versions of your data. You will loose the version history of your contents. ' +
                           'See <a class="rcd-material-link" href="http://xp.readthedocs.io/en/6.11/operations/export.html">Export and Import</a> for more information.';

        const viewDefinition = 'This widget lists in a table all the exports located in $XP_HOME/data/export. ' +
                               'You can export the current content or upload previously archived exports. ' +
                               'Importing exports will import them as children under the current content. ' +
                               'You can also delete or archive (ZIP) and download existing exports.';

        new HelpDialog('Content Exports', [definition, viewDefinition]).
            init().
            addActionDefinition({
                iconSrc: config.assetsUrl + '/icons/export-icon.svg',
                definition: 'Export the current content into $XP_HOME/data/export/[export-name].'
            }).
            addActionDefinition({iconName: 'file_upload', definition: 'Upload archived exports and unzip them into $XP_HOME/data/export'}).
            addActionDefinition({
                iconSrc: config.assetsUrl + '/icons/import-icon.svg',
                definition: 'Import the selected exports. Their contents will be imported as children under the specified content path ' +
                            '(at the root if no value is specified).'
            }).
            addActionDefinition({iconName: 'file_download', definition: 'Zip the selected exports and download the archive'}).
            addActionDefinition({iconName: 'delete', definition: 'Delete the selected exports.'}).
            open();
    }

    function handleResultError(result) {
        if (result.error) {
            console.log(result.error);
            new RcdMaterialSnackbar(result.error).init().open(exportWidgetContainer);
            return false;
        }
        return true;
    }

    function handleAjaxError(jqXHR) {
        let errorMessage;
        if (jqXHR.status) {
            errorMessage = 'Error ' + jqXHR.status + ': ' + jqXHR.statusText;
        } else {
            errorMessage = 'Connection refused';
        }
        console.log(errorMessage);
        new RcdMaterialSnackbar(errorMessage).
            init().open(exportWidgetContainer);
    }

    function showLongInfoDialog(text) {
        return new RcdMaterialInfoDialog({text: text, overlay: true}).
            init().
            open();
    }

    function showShortInfoDialog(text) {
        return new RcdMaterialInfoDialog({text: text}).
        init().
        open(exportWidgetContainer);
    }

    function showConfirmationDialog(text, confirmationLabel, callback) {
        return new RcdMaterialConfirmationDialog({text: text, confirmationLabel: confirmationLabel, callback: callback}).
            init().
            open();
    }

    function showInputDialog(params) {
        return new RcdMaterialInputDialog(params).
            init().
            open();
    }

    function showSelectionDialog(params) {
        return new RcdMaterialSelectionDialog(params).
            init().
            open();
    }

    function showDetailsDialog(title, text, callback) {
        return new RcdMaterialDetailsDialog({title: title, text: text, callback: callback}).
            init().
            open();
    }

    function displaySnackbar(text) {
        new RcdMaterialSnackbar(text).init().open(exportWidgetContainer);
    }
}());


