//Permissives Regexps. Stricter validation is done server-side
const Formats = {
    BINARY_REFERENCE_REGEXP: /.+/i,
    DATE_TIME_REGEXP: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/i,
    DOUBLE_REGEXP: /.+/,
    GEO_POINT_REGEXP: /^[^,]+,[^,]+$/,
    LOCAL_DATE_REGEXP: /^\d{4}-\d{2}-\d{2}$/,
    LOCAL_DATE_TIME_REGEXP: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/i,
    LOCAL_TIME_REGEXP: /^\d{1,2}:\d{2}(?::\d{2})?$/,
    LONG_REGEXP: /.+/,
    REFERENCE_REGEXP: /^[a-z0-9A-Z_\-\.:]+$/
}

class PropertyDialog extends RcdMaterialModalDialog {

    constructor(params) {
        super(params.action + ' property', params.text, true, true);
        this.enabled = true;
        this.valueInputReceived = false;
        this.action = params.action;
        this.callback = params.callback;
        let options = ['BinaryReference', 'Boolean', 'DateTime', 'Double', 'GeoPoint', 'LocalDate', 'LocalDateTime', 'LocalTime',
            'Long', 'PropertySet', 'Reference', 'String', 'Xml']; //TODO Removed Link type for now
        this.nameField = params.action == 'Create' && new RcdMaterialTextField('Name', 'Name').init();
        const type = params.property && params.property.type || 'String';
        this.typeDropdown = new RcdMaterialDropdown('Type', options)
            .init()
            .selectOption(type);


        this.valueTextArea = new RcdMaterialTextArea('Value', 'Value').init().setRows(5);
        this.valueField = new RcdMaterialTextField('Value', 'Value').init();
        this.valueDropdown = new RcdMaterialDropdown('Value', ['true', 'false']).init();

        switch (type) {
        case 'String':
        case 'Xml':
            this.valueTextArea.setValue(params.property && params.property.value || '');
            break;
        case 'Boolean':
            this.valueDropdown.selectOption((params.property && params.property.value == 'true') ? 'true' : 'false');
            break;
        default:
            this.valueField.setValue(params.property && params.property.value || '');
        }
    }

    init() {
        const closeCallback = () => this.close();
        const confirmationCallback = (source, event) => {
            if (this.enabled) {
                this.close();
                if (this.action == 'Create') {
                    this.callback(this.nameField.getValue(), this.getType(), this.getValue());
                } else {
                    this.callback(this.getType(), this.getValue());
                }
            }
            event.stopPropagation();
        };

        super.init()
            .addClass('dtb-property-dialog')
            .addAction('CANCEL', closeCallback)
            .addAction(this.action == 'Create' ? 'Create' : 'Update', confirmationCallback)
            .addKeyUpListener('Enter', confirmationCallback)
            .addKeyUpListener('Escape', closeCallback)
            .addItem(this.nameField)
            .addItem(this.typeDropdown)
            .addItem(this.valueField)
            .addItem(this.valueTextArea)
            .addItem(this.valueDropdown)
            .displayValueField();


        if (this.nameField) {
            this.enable(false);
            this.nameField.addInputListener(() => this.onInput());
        }

        this.typeDropdown.addChangeListener(() => {
            this.displayValueField();
            if (this.action === 'Create' && !this.valueInputReceived) {
                this.generateValue();
                this.focusValueField();
            } else {

            }
            this.onInput();
        });

        const onValueModification = () => {
            this.valueInputReceived = true;
            this.onInput();
        };
        this.valueField.addInputListener(onValueModification);
        this.valueTextArea.addInputListener(onValueModification);
        this.valueDropdown.addChangeListener(onValueModification);

        return this;
    }

    displayValueField() {
        switch (this.getType()) {
        case 'String':
        case 'Xml':
            this.valueTextArea.show();
            this.valueField.hide();
            this.valueDropdown.hide();
            break;
        case 'Boolean':
            this.valueTextArea.hide();
            this.valueField.hide();
            this.valueDropdown.show();
            break;
        case 'PropertySet':
            this.valueTextArea.hide();
            this.valueField.hide();
            this.valueDropdown.hide();
            break;
        default:
            this.valueTextArea.hide();
            this.valueField.show();
            this.valueDropdown.hide();
        }
    }

    focusValueField() {
        switch (this.getType()) {
        case 'String':
        case 'Xml':
            this.valueTextArea.focus().select();
            break;
        case 'Boolean':
            this.valueDropdown.focus();
            break;
        case 'PropertySet':
            break;
        default:
            this.valueField.focus().select();
        }
    }

    getType() {
        return this.typeDropdown.getSelectedValue();
    }

    getValue() {
        switch (this.getType()) {
        case 'String':
        case 'Xml':
            return this.valueTextArea.getValue();
        case 'Boolean':
            return this.valueDropdown.getSelectedValue();
        default:
            return this.valueField.getValue();
        }
    }

    onInput() {
        this.enable(this.shouldEnable());
    }

    shouldEnable() {
        if (this.getValue() === '' && this.getType() !== 'PropertySet') {
            return false;
        }

        return this.isValidValue();
    }

    isValidValue() {
        const type = this.getType();
        const value = this.valueField.getValue();
        switch (type) {
        case 'BinaryReference':
            if (!Formats.BINARY_REFERENCE_REGEXP.test(value)) {
                return false;
            }
            break;
        case 'DateTime':
            if (!Formats.DATE_TIME_REGEXP.test(value)) {
                return false;
            }
            break;
        case 'Double':
            if (!Formats.DOUBLE_REGEXP.test(value)) {
                return false;
            }
            break;
        case 'GeoPoint':
            if (!Formats.GEO_POINT_REGEXP.test(value)) {
                return false;
            }
            break;
        case 'LocalDate':
            if (!Formats.LOCAL_DATE_REGEXP.test(value)) {
                return false;
            }
            break;
        case 'LocalDateTime':
            if (!Formats.LOCAL_DATE_TIME_REGEXP.test(value)) {
                return false;
            }
            break;
        case 'LocalTime':
            if (!Formats.LOCAL_TIME_REGEXP.test(value)) {
                return false;
            }
            break;
        case 'Long':
            if (!Formats.LONG_REGEXP.test(value)) {
                return false;
            }
            break;
        case 'Reference':
            if (!Formats.REFERENCE_REGEXP.test(value)) {
                return false;
            }
            break;
        }
        return true;
    }

    generateValue() {
        let generatedValue;
        switch (this.getType()) {
        case 'Boolean':
            generatedValue = 'false';
            break;
        case 'DateTime':
            generatedValue = new Date().toISOString();
            break;
        case 'Double':
            generatedValue = '0.0';
            break;
        case 'GeoPoint':
            generatedValue = '59.9090313,10.7421944';
            break;
        case 'LocalDate':
            generatedValue = toLocalDateFormat();
            break;
        case 'LocalDateTime':
            generatedValue = toLocalDateTimeFormat();
            break;
        case 'LocalTime':
            generatedValue = toLocalTimeFormat();
            break;
        case 'Long':
            generatedValue = '0';
            break;
        default:
            generatedValue = '';
        }

        switch (this.getType()) {
        case 'String':
        case 'Xml':
            this.valueTextArea.setValue(generatedValue);
            break;
        case 'Boolean':
            this.valueDropdown.selectOption(generatedValue);
        default:
            this.valueField.setValue(generatedValue);
        }
    }

    open(parent) {
        super.open(parent);
        if (this.nameField) {
            this.nameField.focus().select();
        } else {
            this.focusValueField();
        }
        return this;
    }

    enable(enabled) {
        this.enabled = enabled;
        this.dialog.actions.children[1].enable(enabled); //TODO Refactor
    }
}

class PropertiesRoute extends DtbRoute {
    constructor() {
        super({
            state: 'properties'
        });
    }

    onDisplay() {
        this.refreshBreadcrumbs();
        this.retrieveProperties();
    }

    createLayout() {
        const createPropertyIconArea = new RcdGoogleMaterialIconArea('add_circle', () => this.createProperty()).init()
            .setTooltip('Create property');
        const deletePropertyIconArea = new RcdGoogleMaterialIconArea('delete', () => this.deleteProperties()).init()
            .setTooltip('Delete selected properties', RcdMaterialTooltipAlignment.RIGHT);

        this.tableCard = new RcdMaterialTableCard('Properties').init()
            .addClass('dtb-table-card-properties')
            .addColumn('Name', {classes: ['non-mobile-cell']})
            .addColumn('Index', {classes: ['non-mobile-cell', 'index']})
            .addColumn('Name[Idx]', {classes: ['mobile-cell']})
            .addColumn('Value', {classes: ['non-mobile-cell']})
            .addColumn('Type', {classes: ['non-mobile-cell', 'type']})
            .addColumn('Type: Value', {classes: ['mobile-cell']})
            .addColumn(null, {icon: true, classes: ['non-mobile-cell']})
            .addColumn(null, {icon: true})
            .addIconArea(createPropertyIconArea, {max: 0})
            .addIconArea(deletePropertyIconArea, {min: 1});

        return new RcdMaterialLayout().init().addChild(this.tableCard);
    }

    retrieveProperties() {
        const infoDialog = showShortInfoDialog('Retrieving properties...');
        this.tableCard.deleteRows();
        const headerRow = this.tableCard
            .createRow({selectable: false})
            .addCell('..', {classes: ['non-mobile-cell']})
            .addCell('', {classes: ['non-mobile-cell']})
            .addCell('..', {classes: ['mobile-cell']})
            .addCell('', {classes: ['non-mobile-cell']})
            .addCell('', {classes: ['non-mobile-cell']})
            .addCell('', {classes: ['mobile-cell']})
            .addCell('', {icon: true, classes: ['non-mobile-cell']})
            .addCell('', {icon: true})
            .addClass('rcd-clickable');
        if (getPropertyParameter()) {
            headerRow.addClickListener(() => setState('properties',
                {repo: getRepoParameter(), branch: getBranchParameter(), path: getPathParameter(), property: this.getParentProperty()}));
        } else {
            headerRow.addClickListener(
                () => setState('node', {repo: getRepoParameter(), branch: getBranchParameter(), path: getPathParameter()}));
        }
        return requestPostJson(config.servicesUrl + '/property-list', {
            data: {
                repositoryName: getRepoParameter(),
                branchName: getBranchParameter(),
                path: getPathParameter(),
                property: getPropertyParameter(),
                start: getStartParameter(),
                count: getCountParameter()
            }
        })
            .then((result) => this.onPropertiesRetrieval(result))
            .catch(handleRequestError)
            .finally(() => infoDialog.close());
    }

    onPropertiesRetrieval(result) {
        const properties = result.success.hits;

        properties.forEach(property => {

            let customIconArea = null;
            if (property.type === 'Reference') {
                const followReferenceCallback = () => setState('node',
                    {repo: getRepoParameter(), branch: getBranchParameter(), id: property.value});
                customIconArea = new RcdGoogleMaterialIconArea('arrow_forward', (source, event) => {
                    followReferenceCallback();
                    event.stopPropagation();
                })
                    .init()
                    .setTooltip('Follow reference');
            } else if (property.type === 'BinaryReference') {
                const downloadCallback = () => {
                    const repositoryNameInput = new RcdInputElement()
                        .init()
                        .setAttribute('type', 'hidden')
                        .setAttribute('name', 'repositoryName')
                        .setAttribute('value', getRepoParameter());
                    const branchNameInput = new RcdInputElement()
                        .init()
                        .setAttribute('type', 'hidden')
                        .setAttribute('name', 'branchName')
                        .setAttribute('value', getBranchParameter());
                    const keyInput = new RcdInputElement()
                        .init()
                        .setAttribute('type', 'hidden')
                        .setAttribute('name', 'key')
                        .setAttribute('value', getPathParameter());
                    const binaryReferenceInput = new RcdInputElement()
                        .init()
                        .setAttribute('type', 'hidden')
                        .setAttribute('name', 'binaryReference')
                        .setAttribute('value', property.value);
                    const downloadForm = new RcdFormElement().init()
                        .setAttribute('action', config.servicesUrl + '/binary-download')
                        .setAttribute('method', 'post')
                        .addChild(repositoryNameInput)
                        .addChild(branchNameInput)
                        .addChild(keyInput)
                        .addChild(binaryReferenceInput);
                    document.body.appendChild(downloadForm.domElement);
                    downloadForm.submit();
                    document.body.removeChild(downloadForm.domElement);
                };
                customIconArea = new RcdGoogleMaterialIconArea('file_download', (source, event) => {
                    downloadCallback();
                    event.stopPropagation();
                })
                    .init()
                    .setTooltip('Download');
            }

            let editPropertyIconArea = null;
            if (property.type !== 'PropertySet' && property.type !== 'Link') {  //TODO Removed Link type for now
                const editPropertyCallback = () => this.editProperty(property);
                editPropertyIconArea = new RcdGoogleMaterialIconArea('edit', (source, event) => {
                    editPropertyCallback();
                    event.stopPropagation();
                })
                    .init()
                    .setTooltip('Edit property');
            }

            const encodedValue = encodeReservedCharacters(property.value);
            const row = this.tableCard.createRow()
                .addCell(property.name, {classes: ['non-mobile-cell']})
                .addCell(property.index, {classes: ['non-mobile-cell']})
                .addCell(property.name + '[' + property.index + ']', {classes: ['mobile-cell']})
                .addCell(encodedValue, {classes: ['non-mobile-cell']})
                .addCell(property.type, {classes: ['non-mobile-cell']})
                .addCell(property.type + ': ' + encodedValue, {classes: ['mobile-cell']})
                .addCell(customIconArea, {icon: true, classes: ['non-mobile-cell']})
                .addCell(editPropertyIconArea, {icon: true})
                .setAttribute('name', property.name)
                .setAttribute('index', property.index);

            if (property.type === 'PropertySet') {
                row.addClass('rcd-clickable').addClickListener(() => setState('properties', {
                    repo: getRepoParameter(),
                    branch: getBranchParameter(),
                    path: getPathParameter(),
                    property: (getPropertyParameter() ? getPropertyParameter() + '.' + property.name : property.name) + '[' +
                              property.index + ']'
                }))
            }
        });

        const startInt = parseInt(getStartParameter());
        const countInt = parseInt(getCountParameter());
        const rowCountCallback = (rowCount) => setState('properties', {
            repo: getRepoParameter(),
            branch: getBranchParameter(),
            path: getPathParameter(),
            property: getPropertyParameter(),
            start: getStartParameter(),
            count: rowCount
        });
        const previousCallback = () => setState('properties', {
            repo: getRepoParameter(),
            branch: getBranchParameter(),
            path: getPathParameter(),
            property: getPropertyParameter(),
            start: Math.max(0, startInt - countInt),
            count: getCountParameter()
        });
        const nextCallback = () => setState('properties', {
            repo: getRepoParameter(),
            branch: getBranchParameter(),
            path: getPathParameter(),
            property: getPropertyParameter(),
            start: startInt + countInt,
            count: getCountParameter()
        });
        this.tableCard.setFooter({
            rowCount: parseInt(getCountParameter()),
            start: parseInt(getStartParameter()),
            count: properties.length,
            total: result.success.total,
            rowCountCallback: rowCountCallback,
            previousCallback: previousCallback,
            nextCallback: nextCallback
        });
    }

    editProperty(property) {
        new PropertyDialog({
            action: 'Edit',
            property: property,
            callback: (type, value) => this.doEditProperty(property, type, value)
        }).init().open();
    }

    doEditProperty(property, type, newValue) {
        const infoDialog = showShortInfoDialog('Updating property...');
        const propertyParameter = (getPropertyParameter() ? getPropertyParameter() + '.' : '') + property.name +
                                  (property.index ? '[' + property.index + ']' : '');
        return requestPostJson(config.servicesUrl + '/property-update', {
            data: {
                repositoryName: getRepoParameter(),
                branchName: getBranchParameter(),
                path: getPathParameter(),
                property: propertyParameter,
                value: newValue,
                type: type
            }
        })
            .then((result) => displaySnackbar('Property updated'))
            .catch(handleRequestError)
            .finally(() => {
                infoDialog.close();
                RcdHistoryRouter.refresh();
            });
    }

    createProperty() {
        new PropertyDialog({
            action: 'Create',
            callback: (name, type, value) => this.doCreateProperty(name, type, value)
        }).init().open();
    }

    doCreateProperty(name, type, value) {
        const infoDialog = showShortInfoDialog('Creating property...');
        return requestPostJson(config.servicesUrl + '/property-create', {
            data: {
                repositoryName: getRepoParameter(),
                branchName: getBranchParameter(),
                path: getPathParameter(),
                parentPath: getPropertyParameter(),
                name: name,
                type: type,
                value: value
            }
        })
            .then((result) => displaySnackbar('Property created'))
            .catch(handleRequestError)
            .finally(() => {
                infoDialog.close();
                RcdHistoryRouter.refresh();
            });
    }

    deleteProperties() {
        showConfirmationDialog('Delete selected properties?', 'DELETE', () => this.doDeleteProperties());
    }

    doDeleteProperties() {
        const infoDialog = showLongInfoDialog('Deleting properties...');
        let properties = {};
        const selectedRows = this.tableCard.getSelectedRows();
        selectedRows.forEach((row) => {
            if (!properties[row.attributes['name']]) {
                properties[row.attributes['name']] = [];
            }
            properties[row.attributes['name']].push(row.attributes['index'])
        });
        requestPostJson(config.servicesUrl + '/property-delete', {
            data: {
                repositoryName: getRepoParameter(),
                branchName: getBranchParameter(),
                path: getPathParameter(),
                parentPath: getPropertyParameter(),
                properties: properties
            }
        })
            .then((result) => displaySnackbar('Property' + (selectedRows.length > 1 ? 's' : '') + ' deleted'))
            .catch(handleRequestError)
            .finally(() => {
                infoDialog.close();
                RcdHistoryRouter.refresh();
            });
    }

    refreshBreadcrumbs() {
        const repositoryName = getRepoParameter();
        const branchName = getBranchParameter();
        const path = getPathParameter();
        const property = getPropertyParameter();

        this.breadcrumbsLayout.setBreadcrumbs([new RcdMaterialBreadcrumb('Data Toolbox').init().setStateRef(''),
            new RcdMaterialBreadcrumb('Data Tree').init().setStateRef('repositories'),
            new RcdMaterialBreadcrumb(repositoryName).init().setStateRef('branches', {repo: repositoryName}),
            new RcdMaterialBreadcrumb(branchName).init().setStateRef('nodes', {repo: repositoryName, branch: branchName})]);

        const rootBreadcrumb = new RcdMaterialBreadcrumb(path === '/' ? 'root!properties' : 'root').init();
        if (path === '/') {
            if (property) {
                rootBreadcrumb.setStateRef('properties', {repo: repositoryName, branch: branchName, path: path});
            }
        } else {
            rootBreadcrumb.setStateRef('nodes', {repo: repositoryName, branch: branchName, path: '/'});
        }
        this.breadcrumbsLayout.addBreadcrumb(rootBreadcrumb);

        if (path === '/') {
            app.setTitle('Root node properties');
        } else {
            const pathElements = path.substring(1).split('/');
            app.setTitle(pathElements[pathElements.length - 1] + ' properties');

            let currentPath = '';
            pathElements.forEach((subPathElement, index, array) => {
                currentPath += '/' + subPathElement;
                const constCurrentPath = currentPath;
                const currentPathBreadcrumb = new RcdMaterialBreadcrumb(
                    index < array.length - 1 ? subPathElement : subPathElement + '!properties').init();
                if (index < array.length - 1) {
                    currentPathBreadcrumb.setStateRef('nodes', {repo: repositoryName, branch: branchName, path: constCurrentPath});
                } else {
                    if (property) {
                        currentPathBreadcrumb.setStateRef('properties', {repo: repositoryName, branch: branchName, path: path});
                    }
                }
                this.breadcrumbsLayout.addBreadcrumb(currentPathBreadcrumb);
            });
        }

        if (property) {
            const propertyElements = property.split('.');
            let currentProperty = '';
            propertyElements.forEach((subPropertyElement, index, array) => {
                currentProperty += currentProperty ? '.' + subPropertyElement : subPropertyElement;
                const constCurrentProperty = currentProperty;
                const simplifiedSubPropertyElement = subPropertyElement.endsWith('[0]')
                    ? subPropertyElement.substring(0, subPropertyElement.length - 3)
                    : subPropertyElement;

                const currentPropertyBreadcrumb = new RcdMaterialBreadcrumb(simplifiedSubPropertyElement).init();
                if (index < array.length - 1) {
                    currentPropertyBreadcrumb.setStateRef('properties',
                        {repo: repositoryName, branch: branchName, path: path, property: constCurrentProperty});
                }
                this.breadcrumbsLayout.addBreadcrumb(currentPropertyBreadcrumb, ' . ');
            });
        }

    }

    displayHelp() {
        const viewDefinition = 'The view represents node properties in a tree structure. ' +
                               'See <a class="rcd-material-link" href="http://xp.readthedocs.io/en/6.10/developer/node-domain/property.html">Property</a> and <a class="rcd-material-link" href="http://xp.readthedocs.io/en/6.10/developer/node-domain/value-types.html">Value Types</a> for more information. ';
        new HelpDialog('Properties', [viewDefinition]).init()
            .addActionDefinition({
                iconName: 'add_circle',
                definition: 'Create a property.'
            })
            .addActionDefinition({
                iconName: 'delete',
                definition: 'Delete the selected properties.'
            })
            .addActionDefinition({
                iconName: 'edit',
                definition: 'Edit property.'
            })
            .open();
    }
}
