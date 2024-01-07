class ProjectsRoute extends DtbRoute {
    constructor() {
        super({
            state: 'projects',
            name: 'Content Tree ',
            iconArea: new RcdImageIconArea(config.assetsUrl + '/icons/contenttree.svg').init()
        });
    }

    onDisplay() {
        this.retrieveProjects();
    }

    createBreadcrumbsLayout() {
        return new RcdMaterialBreadcrumbsLayout().init().addBreadcrumb(
            new RcdMaterialBreadcrumb('Data Toolbox').init().setStateRef('')).addBreadcrumb(
            new RcdMaterialBreadcrumb('Content Tree').init()).addChild(
            new RcdGoogleMaterialIconArea('help', () => this.displayHelp()).init().setTooltip('Help'));
    }

    createLayout() {
        this.tableCard = new RcdMaterialTableCard('Projects').init()
            .addColumn('ID')
            .addColumn('Name')
            .addColumn('Description')
            //.addIconArea(new RcdGoogleMaterialIconArea('add_circle', () => this.createProject()).setTooltip('Create a project', RcdMaterialTooltipAlignment.RIGHT).init(), {max: 0})
            //.addIconArea(new RcdGoogleMaterialIconArea('delete', () => this.deleteProjects()).init().setTooltip('Delete selected projects', RcdMaterialTooltipAlignment.RIGHT), {min: 1});
        return new RcdMaterialLayout().init().addChild(this.tableCard);
    }

    retrieveProjects() {
        const infoDialog = showShortInfoDialog('Retrieving project list...');
        this.tableCard.deleteRows();
        return requestJson(config.servicesUrl + '/project-list')
            .then((result) => {
                result.success.sort((project1, project2) => project1.name - project2.name).forEach((project) => {
                    const rowStateRef = buildStateRef('contents', {project: project.id});
                    const row = this.tableCard.createRow()
                        .addCell(project.id, {href: rowStateRef})
                        .addCell(project.displayName, {href: rowStateRef})
                        .addCell(project.description || '', {href: rowStateRef})
                        .setAttribute('project', project.id);
                    row.checkbox.addClickListener((event) => event.stopPropagation());
                });
            })
            .catch(handleRequestError)
            .finally(() => infoDialog.close());
    }

    createProject() {
        const defaultProjectName = 'project-' + toLocalDateTimeFormat(new Date(), '-', '-').toLowerCase();
        showInputDialog({
            title: 'Create project',
            label: 'Project name',
            placeholder: defaultProjectName,
            value: defaultProjectName,
            confirmationLabel: 'CREATE',
            callback: (value) => this.doCreateProject(value || defaultProjectName)
        });
    }

    doCreateProject(projectName) {
        const infoDialog = showLongInfoDialog('Creating project...');
        requestPostJson(config.servicesUrl + '/project-create', {
            data: {
                projectName: projectName || ('project-' + toLocalDateTimeFormat(new Date(), '-', '-')).toLowerCase()
            }
        })
            .then((result) => displaySuccess('Project created'))
            .catch(handleRequestError)
            .finally(() => {
                infoDialog.close();
                this.retrieveProjects();
            });
    }

    deleteProjects() {
        showConfirmationDialog("Delete selected projects?", 'DELETE', () => this.doDeleteProjects());
    }

    doDeleteProjects() {
        const infoDialog = showLongInfoDialog("Deleting projects...");
        const projectNames = this.tableCard.getSelectedRows().map((row) => row.attributes['project']);
        requestPostJson(config.servicesUrl + '/project-delete', {
            data: {projectNames: projectNames}
        })
            .then((result) => displaySuccess('Repositor' + (projectNames.length > 1 ? 'ies' : 'y') + ' deleted'))
            .catch(handleRequestError)
            .finally(() => {
                infoDialog.close();
                this.retrieveProjects();
            });
    }

    displayHelp() {
        const definition = 'Enonic XP data is split into projects, silos where nodes can be stored.<br/>' +
            'By default 2 projects are present: ' +
            '<b>system-repo</b>, the core project, containing the IAM data, installed applications, project settings, ...' +
            'and <b>com.enonic.cms.default</b>, the CMS project for the default project.<br/>' +
            'See <a class="rcd-material-link" href="https://developer.enonic.com/docs/xp/stable/storage#projects">Projects</a> for more information.';

        const viewDefinition = 'This view lists in a table all the projects. Click on a row to display its branches.';

        new HelpDialog('Projects', [definition, viewDefinition]).init()
            .addActionDefinition({iconName: 'add_circle', definition: 'Create a project with default settings'})
            .addActionDefinition({iconName: 'delete', definition: 'Delete the selected projects.'})
            .open();
    }
}
