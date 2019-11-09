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
        this.tableCard = new RcdMaterialTableCard('Permissions').init().addClass('dtb-table-card-permissions').addColumn('Principal',
            {classes: ['principal']}).addColumn('Permissions', {classes: ['mobile-cell']}).addColumn('Read',
            {classes: ['non-mobile-cell']}).addColumn('Create', {classes: ['non-mobile-cell']}).addColumn('Modify',
            {classes: ['non-mobile-cell']}).addColumn('Delete', {classes: ['non-mobile-cell']}).addColumn('Publish',
            {classes: ['non-mobile-cell']}).addColumn('Read<br/>Perm.', {classes: ['non-mobile-cell']}).addColumn('Write<br/>Perm.',
            {classes: ['non-mobile-cell']});

        return new RcdMaterialLayout().init().addChild(this.tableCard);
    }

    retrievePermissions() {
        const infoDialog = showShortInfoDialog('Retrieving permissions...');
        this.tableCard.deleteRows();
        this.tableCard.createRow({selectable: false})
            .addCell('..')
            .addCell('', {classes: ['mobile-cell']})
            .addCell('', {classes: ['non-mobile-cell']})
            .addCell('', {classes: ['non-mobile-cell']})
            .addCell('', {classes: ['non-mobile-cell']})
            .addCell('', {classes: ['non-mobile-cell']})
            .addCell('', {classes: ['non-mobile-cell']})
            .addCell('', {classes: ['non-mobile-cell']})
            .addCell('', {classes: ['non-mobile-cell']})
            .addClass('rcd-clickable')
            .addClickListener(() => setState('node', {repo: getRepoParameter(), branch: getBranchParameter(), path: getPathParameter()}));

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
        this.setInheritPermission(result.success._inheritsPermissions);
        result.success._permissions.forEach((accessControlEntry) => {
            this.tableCard.createRow({selectable: false})
                .addCell(accessControlEntry.principal, {classes: ['principal']})
                .addCell(
                    this.createPermissionResume(accessControlEntry), {classes: ['mobile-cell']})
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

    createPermissionResume(accessControlEntry) {
        let permissions = [];
        PermissionsRoute.getPermissions().forEach(permission => {
            if (this.hasPermission(accessControlEntry, permission)) {
                permissions.push(permission);
            }
        });

        return permissions.join(', ');
    }

    hasPermission(accessControlEntry, permission) {
        return accessControlEntry.deny.indexOf(permission) === -1 &&
               accessControlEntry.allow.indexOf(permission) !== -1;
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
                           'See <a class="rcd-material-link" href="http://xp.readthedocs.io/en/6.10/admin/contentstudio/content-security.html">Content Security</a> for more information. ';

        const viewDefinition = 'The view lists in a table all the permissions of the current node. Creation, modification and deletion of permissions will be provided in an ulterior version.';
        new HelpDialog('Permissions', [definition, viewDefinition]).init().open();
    }
}
