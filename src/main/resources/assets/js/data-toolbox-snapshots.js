class SnapshotsRoute extends DtbRoute {
    constructor() {
        super({
            state: 'snapshots',
            name: 'Snapshots',
            iconArea: new RcdGoogleMaterialIconArea('photo_camera').init()
        });
    }

    onDisplay() {
        this.retrieveSnapshots();
    }
    
    createBreadcrumbsLayout() {
        return new RcdMaterialBreadcrumbsLayout().init().
            addBreadcrumb(new RcdMaterialBreadcrumb('Data Toolbox').init().setStateRef('')).
            addBreadcrumb(new RcdMaterialBreadcrumb('Snapshots').init()).
            addChild(new RcdGoogleMaterialIconArea('help', () => this.displayHelp()).init().setTooltip('Help'));
    }
    
    createLayout() {
        this.tableCard = new RcdMaterialTableCard('Snapshots').init().
            addColumn('Snapshot name').
            addColumn('Timestamp', {classes: ['non-mobile-cell']}).
            addIconArea(new RcdGoogleMaterialIconArea('add_circle', () => this.createSnapshot()).init().setTooltip('Create a snapshot'), {max: 0}).
            addIconArea(new RcdGoogleMaterialIconArea('restore', () => this.restoreSnapshot()).init().setTooltip('Restore selected snapshot'),
                {min: 1, max: 1}).
            addIconArea(new RcdGoogleMaterialIconArea('delete', () => this.deleteSnapshots()).init().setTooltip('Delete selected snapshots', RcdMaterialTooltipAlignment.RIGHT), {min: 1});
        return new RcdMaterialLayout().init().
            addChild(this.tableCard);
    }

    retrieveSnapshots() {
        const infoDialog = showShortInfoDialog('Retrieving snapshot list...');
        return $.ajax({
            url: config.servicesUrl + '/snapshot-list'
        }).done((result) => {
            this.tableCard.deleteRows();
            if (handleResultError(result)) {
                result.success.sort((snapshot1, snapshot2) => snapshot2.timestamp - snapshot1.timestamp).
                forEach((snapshot) => {
                    this.tableCard.createRow().
                        addCell(snapshot.name).
                        addCell(toLocalDateTimeFormat(new Date(snapshot.timestamp)), {classes: ['non-mobile-cell']}).
                        setAttribute('snapshot', snapshot.name);
                });
            }
        }).fail(handleAjaxError).always(() => {
            infoDialog.close();
        });
    }

    createSnapshot() {
        const defaultSnapshotName = 'snapshot-' + toLocalDateTimeFormat(new Date(), '-', '-');
        showInputDialog({
            title: 'Create snapshot',
            label: 'Snapshot name',
            placeholder: defaultSnapshotName,
            value: defaultSnapshotName,
            confirmationLabel: 'CREATE',
            callback: (value) => this.doCreateSnapshot(value || defaultSnapshotName)
        });
    }

    doCreateSnapshot(snapshotName) {
        const infoDialog = showLongInfoDialog('Creating snapshot...');
        $.ajax({
            method: 'POST',
            url: config.servicesUrl + '/snapshot-create',
            data: JSON.stringify({
                snapshotName: snapshotName || ('snapshot-' + toLocalDateTimeFormat(new Date(), '-', '-'))
            }),
            contentType: 'application/json; charset=utf-8'
        }).done((result) => handleTaskCreation(result, {
            taskId: result.taskId,
            message: 'Creating snapshot...',
            doneCallback: () => displaySnackbar('Snapshot created'),
            alwaysCallback: () => this.retrieveSnapshots()
        })).fail(handleAjaxError).always(() => {
            infoDialog.close();
        });
    }

    deleteSnapshots() {
        showConfirmationDialog("Delete selected snapshots?", 'DELETE', () => this.doDeleteSnapshots());
    }

    doDeleteSnapshots() {
        const infoDialog = showLongInfoDialog("Deleting snapshots...");
        const snapshotNames = this.tableCard.getSelectedRows().map((row) => row.attributes['snapshot']);
        $.ajax({
            method: 'POST',
            url: config.servicesUrl + '/snapshot-delete',
            data: JSON.stringify({snapshotNames: snapshotNames}),
            contentType: 'application/json; charset=utf-8'
        }).done((result) => handleTaskCreation(result, {
            taskId: result.taskId,
            message: 'Deleting snapshots...',
            doneCallback: () => displaySnackbar('Snapshot' + (snapshotNames.length > 1 ? 's' : '') + ' deleted'),
            alwaysCallback: () => this.retrieveSnapshots()
        })).fail(handleAjaxError).always(() => {
            infoDialog.close();
        });
    }

    restoreSnapshot() {
        const infoDialog = showLongInfoDialog("Restoring snapshot...");
        const snapshotName = this.tableCard.getSelectedRows().map((row) => row.attributes['snapshot'])[0];
        $.ajax({
            method: 'POST',
            url: config.servicesUrl + '/snapshot-restore',
            data: JSON.stringify({snapshotName: snapshotName}),
            contentType: 'application/json; charset=utf-8'
        }).done(handleResultError).fail(handleAjaxError).always(() => {
            infoDialog.close();
        });
    }

    displayHelp() {
        const definition = 'A snapshot is a record of your Enonic XP indexes at a particular point in time. ' +
                           'Your first snapshot will be a complete copy of your indexes, but all subsequent snapshots will save the delta between the existing snapshots and the current state.' +
                           'This makes snapshots optimized for repetitive saves and allow to quickly rollback to a previous state in one click. It is also used, in addition to blobs backup (not covered by this tool), for backing up your data. ' +
                           'See <a class="rcd-material-link" href="http://xp.readthedocs.io/en/6.10/operations/backup.html#backing-up-indexes">Backing up indexes</a> for more information.';

        const viewDefinition = 'The view lists in a table all the snapshots. ' +
                               'You can generate a new snapshot, restore the indexes to a previous state or delete existing snapshots.';

        new HelpDialog('Snaphots', [definition, viewDefinition]).
            init().
            addActionDefinition({iconName: 'add_circle', definition: 'Generate a snapshot of the indexes'}).
            addActionDefinition({iconName: 'restore', definition: 'Restore the indexes to the selected snapshot'}).
            addActionDefinition({iconName: 'delete', definition: 'Delete the selected snapshots.'}).
            open();
    }

}
