class EditAccessControlEntryDialog extends RcdMaterialModalDialog {
    constructor(mode, accessControlEntry, callback, deleteCallback) {
        super(mode + ' access control entry', null, true, true);
        this.mode = mode;
        this.callback = callback;
        this.deleteCallback = deleteCallback;
        const principalComponents = accessControlEntry.principal.split(':');
        this.principalTypeField = new RcdMaterialDropdown('Principal type', ['role', 'user', 'group']).init()
            .selectOption(principalComponents[0]);
        this.idProviderField = new RcdMaterialTextField('ID Provider').init();
        this.principalIdField = new RcdMaterialTextField('Principal ID').init();
        const permissionResume = PermissionsRoute.createPermissionResume(accessControlEntry);
        this.permissionResumeField =
            new RcdMaterialDropdown('Permission', ['Can Read', 'Can Write', 'Can Publish', 'Full Access', 'Custom']).init()
                .selectOption(permissionResume.custom ? 'Custom' : permissionResume.text);
        if (principalComponents[0] !== 'role') {
            this.idProviderField.setValue(principalComponents[1]);
        }
        this.principalIdField.setValue(principalComponents[principalComponents.length - 1]);
    }

    init() {
        return super.init()
            .addItem(this.principalTypeField)
            .addItem(this.idProviderField)
            .addItem(this.principalIdField)
            .addItem(this.permissionResumeField)
            .addAction('CANCEL', () => this.close())
            .addAction('DELETE', () => {
                this.close();
                this.deleteCallback();
            })
            .addAction(this.mode, () => {
                const principalType = this.principalTypeField.getSelectedValue();
                const principal = principalType + ':'
                                  + (principalType === 'role' ? '' : (this.idProviderField.getValue() + ':'))
                                  + this.principalIdField.getValue();
                const permissionResume = this.permissionResumeField.getSelectedValue();

                this.close();
                if (permissionResume === 'Custom') {
                    this.callback({
                        principal: principal,
                        allow: [],
                        deny: []
                    });
                } else {
                    this.callback({
                        principal: principal,
                        allow: PermissionsRoute.createAllowedPermissionfromResume(permissionResume),
                        deny: []
                    });
                }


            })
            .addKeyDownListener('Escape', () => this.close());
    }
}

class EditPermissionsDialog extends RcdMaterialModalDialog {
    constructor(permissionsInfo, editCallback) {
        super('Edit permissions', null, true, true);
        this.permissionsInfo = permissionsInfo;
        this.editCallback = editCallback;
        this.inheritPermissionsField = new DtbCheckboxField({
            label: 'Inherit permissions',
            callback: () => this.inheritPermissionsField.select(!this.inheritPermissionsField.isSelected())
        }).init()
            .select(permissionsInfo.inheritsPermissions);
        this.overwriteChildPermissionsField = new DtbCheckboxField({
            label: 'Overwrite child permissions',
            callback: () => this.overwriteChildPermissionsField.select(!this.overwriteChildPermissionsField.isSelected())
        }).init().select(false);

        this.permissionList = new RcdMaterialList().init();
        this.accessControlEntries = [];
        this.permissionList.createRow('Add permission', null, {icon: new RcdGoogleMaterialIcon('add').init()});
        permissionsInfo.permissions.forEach(accessControlEntry => this.onEntryAdded(accessControlEntry));
    }

    editEntry(accessControlEntry, row) {
        new EditAccessControlEntryDialog('Edit', accessControlEntry,
            (newAccessControlEntry) => this.onEntryEdited(accessControlEntry, row, newAccessControlEntry),
            () => this.onEntryDeleted(accessControlEntry, row)).init().open();
    }

    onEntryEdited(accessControlEntry, row, newAccessControlEntry) {
        this.onEntryDeleted(accessControlEntry, row);
        this.onEntryAdded(newAccessControlEntry);
    }

    onEntryDeleted(accessControlEntry, row) {
        this.accessControlEntries.indexOf(accessControlEntry);
        this.permissionList.deleteRow(row);
        return this;
    }

    onEntryAdded(accessControlEntry) {
        this.accessControlEntries.push(accessControlEntry);
        const row = this.permissionList.createRow(accessControlEntry.principal,
            PermissionsRoute.createPermissionResume(accessControlEntry).text,
            {
                callback: () => this.editEntry(accessControlEntry, row),
                icon: new RcdGoogleMaterialIcon('edit').init()
            });
    }

    init() {
        return super.init()
            .addItem(this.inheritPermissionsField)
            .addItem(this.overwriteChildPermissionsField)
            .addItem(this.permissionList)
            .addAction('CANCEL', () => this.close())
            .addAction('APPLY', () => {
                this.close();
                this.editCallback({
                    repositoryName: getRepoParameter(),
                    branchName: getBranchParameter(),
                    nodeId: this.permissionsInfo.id,
                    inheritPermissions: this.inheritPermissionsField.isSelected(),
                    overwriteChildPermissions: this.overwriteChildPermissionsField.isSelected()
                });
            })
            .addKeyDownListener('Escape', () => this.close());
    }
}

class PermissionsRoute extends DtbRoute {
    constructor() {
        super({
            state: 'permissions'
        });
    }

    static getPermissions() {
        return ['READ', 'CREATE', 'MODIFY', 'DELETE', 'PUBLISH', 'READ_PERMISSIONS', 'WRITE_PERMISSIONS'];
    }

    onDisplay() {
        this.refreshBreadcrumbs();
        this.retrievePermissions();
    }

    createLayout() {
        const editIconArea = new RcdGoogleMaterialIconArea('edit', () => this.editPermissions()).init()
            .setTooltip('Edit permissions', RcdMaterialTooltipAlignment.RIGHT);
        this.tableCard = new RcdMaterialTableCard('Permissions', {selectable: false}).init()
            .addClass('dtb-table-card-permissions')
            .addIconArea(editIconArea)
            .addColumn('Principal', {classes: ['principal']})
            .addColumn('Permissions', {classes: ['mobile-cell']})
            .addColumn('Read', {classes: ['non-mobile-cell']})
            .addColumn('Create', {classes: ['non-mobile-cell']})
            .addColumn('Modify', {classes: ['non-mobile-cell']})
            .addColumn('Delete', {classes: ['non-mobile-cell']})
            .addColumn('Publish', {classes: ['non-mobile-cell']})
            .addColumn('Read<br/>Perm.', {classes: ['non-mobile-cell']})
            .addColumn('Write<br/>Perm.', {classes: ['non-mobile-cell']});

        return new RcdMaterialLayout().init().addChild(this.tableCard);
    }

    editPermissions() {
        if (this.permissionsInfo) {
            new EditPermissionsDialog(this.permissionsInfo, (params) => this.doEditPermissions(params)).init()
                .open();
        }
    }

    doEditPermissions(params) {
        const infoDialog = showLongInfoDialog("Applying permissions...");
        requestPostJson(config.servicesUrl + '/permission-apply', {
            data: params
        })
            .then((result) => handleTaskCreation(result, {
                taskId: result.taskId,
                message: 'Applying permissions...',
                doneCallback: (success) => displaySuccess(
                    success.succeedNodes + ' nodes updated'),
                alwaysCallback: () => this.retrievePermissions()
            }))
            .catch(handleRequestError)
            .finally(() => infoDialog.close());
    }

    retrievePermissions() {
        const infoDialog = showShortInfoDialog('Retrieving permissions...');
        this.tableCard.deleteRows();
        const parentStateRef = buildStateRef('node', {repo: getRepoParameter(), branch: getBranchParameter(), path: getPathParameter()});
        this.tableCard.createRow({selectable: false})
            .addCell('..', {href: parentStateRef})
            .addCell('', {href: parentStateRef, reachable: false, classes: ['mobile-cell']})
            .addCell('', {href: parentStateRef, reachable: false, classes: ['non-mobile-cell']})
            .addCell('', {href: parentStateRef, reachable: false, classes: ['non-mobile-cell']})
            .addCell('', {href: parentStateRef, reachable: false, classes: ['non-mobile-cell']})
            .addCell('', {href: parentStateRef, reachable: false, classes: ['non-mobile-cell']})
            .addCell('', {href: parentStateRef, reachable: false, classes: ['non-mobile-cell']})
            .addCell('', {href: parentStateRef, reachable: false, classes: ['non-mobile-cell']})
            .addCell('', {href: parentStateRef, reachable: false, classes: ['non-mobile-cell']});

        return requestPostJson(config.servicesUrl + '/permission-list', {
            data: {
                repositoryName: getRepoParameter(),
                branchName: getBranchParameter(),
                key: getPathParameter()
            }
        })
            .then((result) => this.onPermissionsRetrieval(result))
            .catch(handleRequestError)
            .finally(() => infoDialog.close());
    }

    onPermissionsRetrieval(result) {
        this.setInheritPermission(result.success.inheritsPermissions);
        result.success.permissions.forEach((accessControlEntry) => {
            this.permissionsInfo = result.success;
            this.tableCard.createRow({selectable: false})
                .addCell(accessControlEntry.principal, {classes: ['principal']})
                .addCell(
                    PermissionsRoute.createPermissionResume(accessControlEntry).text, {classes: ['mobile-cell']})
                .addCell(
                    this.createPermissionIcon(accessControlEntry, 'READ'),
                    {icon: true, classes: ['non-mobile-cell', 'permission']})
                .addCell(
                    this.createPermissionIcon(accessControlEntry, 'CREATE'),
                    {icon: true, classes: ['non-mobile-cell', 'permission']})
                .addCell(
                    this.createPermissionIcon(accessControlEntry, 'MODIFY'),
                    {icon: true, classes: ['non-mobile-cell', 'permission']})
                .addCell(
                    this.createPermissionIcon(accessControlEntry, 'DELETE'),
                    {icon: true, classes: ['non-mobile-cell', 'permission']})
                .addCell(
                    this.createPermissionIcon(accessControlEntry, 'PUBLISH'),
                    {icon: true, classes: ['non-mobile-cell', 'permission']})
                .addCell(
                    this.createPermissionIcon(accessControlEntry, 'READ_PERMISSIONS'),
                    {icon: true, classes: ['non-mobile-cell', 'permission']})
                .addCell(
                    this.createPermissionIcon(accessControlEntry, 'WRITE_PERMISSIONS'),
                    {icon: true, classes: ['non-mobile-cell', 'permission']}).setAttribute('principal', accessControlEntry.principal);
        });
    }

    setInheritPermission(inheritsPermissions) {
        this.tableCard.setTitle('Permissions' + (inheritsPermissions ? ' (inherited)' : ''));
    }

    createPermissionIcon(accessControlEntry, permission) {
        if (accessControlEntry.deny.indexOf(permission) !== -1) {
            return new RcdGoogleMaterialIconArea('block').init();
        }
        if (accessControlEntry.allow.indexOf(permission) !== -1) {
            return new RcdGoogleMaterialIconArea('check').init();
        }
        return '';
    }

    static createPermissionResume(accessControlEntry) {
        if (isEqualArray(accessControlEntry.deny, [])) {
            if (isEqualArray(accessControlEntry.allow, ['READ'])) {
                return {custom: false, text: 'Can Read'};
            }
            if (isEqualArray(accessControlEntry.allow, ['READ', 'CREATE', 'MODIFY', 'DELETE'])) {
                return {custom: false, text: 'Can Write'};
            }
            if (isEqualArray(accessControlEntry.allow, ['READ', 'CREATE', 'MODIFY', 'DELETE', 'PUBLISH'])) {
                return {custom: false, text: 'Can Publish'};
            }
            if (isEqualArray(accessControlEntry.allow,
                ['READ', 'CREATE', 'MODIFY', 'DELETE', 'PUBLISH', 'READ_PERMISSIONS', 'WRITE_PERMISSIONS'])) {
                return {custom: false, text: 'Full Access'};
            }
        }
        return {
            custom: true, text: 'Allowed: [' + accessControlEntry.allow.join(', ') + ']\n' +
                                'Denied:[' + accessControlEntry.deny.join(', ') + ']'
        };
    }

    static createAllowedPermissionfromResume(resume) {
        switch (resume) {
        case 'Can Read':
            return ['READ'];
        case 'Can Write':
            return ['READ', 'CREATE', 'MODIFY', 'DELETE'];
        case 'Can Publish':
            return ['READ', 'CREATE', 'MODIFY', 'DELETE', 'PUBLISH'];
        case 'Full Access':
            return ['READ', 'CREATE', 'MODIFY', 'DELETE', 'PUBLISH', 'READ_PERMISSIONS', 'WRITE_PERMISSIONS'];
        default:
            return null;
        }
    }

    refreshBreadcrumbs() {
        const repositoryName = getRepoParameter();
        const branchName = getBranchParameter();
        const path = getPathParameter();

        this.breadcrumbsLayout.setBreadcrumbs([new RcdMaterialBreadcrumb('Data Toolbox').init().setStateRef(''),
            new RcdMaterialBreadcrumb('Data Tree').init().setStateRef('repositories'),
            new RcdMaterialBreadcrumb(repositoryName).init().setStateRef('branches', {repo: repositoryName}),
            new RcdMaterialBreadcrumb(branchName).init().setStateRef('nodes', {repo: repositoryName, branch: branchName})]);

        const rootBreadcrumb = new RcdMaterialBreadcrumb(path === '/' ? 'root!permissions' : 'root').init();
        if (path !== '/') {
            rootBreadcrumb.setStateRef('nodes', {repo: repositoryName, branch: branchName, path: '/'});
        }
        this.breadcrumbsLayout.addBreadcrumb(rootBreadcrumb);

        if (path === '/') {
            app.setTitle('Root node permissions');
        } else {
            const pathElements = path.substring(1).split('/')
            app.setTitle(pathElements[pathElements.length - 1] + ' permissions');

            let currentPath = '';
            pathElements.forEach((subPathElement, index, array) => {
                currentPath += '/' + subPathElement;
                const constCurrentPath = currentPath;
                const currentPathBreadcrumb = new RcdMaterialBreadcrumb(
                    index < array.length - 1 ? subPathElement : subPathElement + '!permissions').init();
                if (index < array.length - 1) {
                    currentPathBreadcrumb.setStateRef('nodes', {repo: repositoryName, branch: branchName, path: constCurrentPath});
                }
                this.breadcrumbsLayout.addBreadcrumb(currentPathBreadcrumb);
            });
        }

    }

    displayHelp() {
        const definition = 'Permissions are granted to principals (users, groups and roles) on a per-node basis. This means that changing a principal’s permissions for one node does not affect that principal’s permissions for other node.' +
                           'See <a class="rcd-material-link" href="https://developer.enonic.com/docs/content-studio/stable/permissions">Permissions</a> for more information. ';

        const viewDefinition = 'The view lists in a table all the permissions of the current node. Creation, modification and deletion of permissions will be provided in an ulterior version.';
        new HelpDialog('Permissions', [definition, viewDefinition]).init().open();
    }
}
