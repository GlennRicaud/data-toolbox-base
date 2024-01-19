class FiltersDialog extends RcdMaterialModalDialog {
    constructor(filtersField) {
        super('Filters', null, true, true);
        this.filtersField = filtersField;
        const parsedValue = parseJson(this.filtersField.getValue());
        this.filtersArea = new RcdMaterialTextArea('Filters', this.prettify(parseJson('{"exists":{"field":"modifiedTime"}}'))).init()
            .setValue(parsedValue ? this.prettify(parsedValue) : this.filtersField.getValue());
    }

    init() {
        return super.init()
            .addClass('dtb-search-filters-dialog')
            .addItem(this.filtersArea)
            .addAction('CLOSE', () => this.close())
            .addAction('PRETTIFY', () => this.prettifyContent())
            .addAction('SET', () => this.setFilter());
    }

    prettifyContent() {
        const parsedValue = parseJson(this.filtersArea.getValue());
        if (parsedValue) {
            this.filtersArea.setValue(this.prettify(parsedValue));
        } else {
            displayError('Invalid JSON', this);
        }
    }

    prettify(object) {
        return JSON.stringify(object, null, 2);
    }

    minify(object) {
        return JSON.stringify(object, null, 0);
    }

    setFilter() {
        const parsedValue = parseJson(this.filtersArea.getValue());
        if (parsedValue) {
            this.close();
            this.filtersField.setValue(this.minify(parsedValue));
        } else {
            displayError('Invalid JSON', this);
        }
    }
}

class ReportDialog extends RcdMaterialModalDialog {
    constructor(params, nodeCount) {
        super('Node Query Report', null, true, true);
        this.params = params;
        this.defaultReportName = 'query-report-' + toLocalDateTimeFormat(new Date(), '-', '-');
        this.reportNameTextField =
            new RcdMaterialTextField('Report name', this.defaultReportName).init().setValue(this.defaultReportName || '');
        this.formatDropdownField = new RcdMaterialDropdown('Format', ['Node fields as TSV', 'Node as JSON tree']).init()
            .addChangeListener(() => this.fieldsField.show('Node fields as TSV' === this.formatDropdownField.getSelectedValue()));
        this.fieldsField = new RcdMaterialTextField('Fields', 'Example: _id,_path').init().setValue('_id,_path');
        this.nodeCountField = new RcdTextElement('Number of exported nodes: ' + nodeCount).init();
    }

    init() {
        return super.init()
            .addItem(this.reportNameTextField)
            .addItem(this.formatDropdownField)
            .addItem(this.fieldsField)
            .addItem(this.nodeCountField)
            .addAction('CLOSE', () => this.close())
            .addAction('GENERATE', () => this.report());
    }

    report() {
        this.close();
        const infoDialog = showLongInfoDialog("Generating report...");
        const reportName = this.reportNameTextField.getValue() || this.defaultReportName;
        requestPostJson(config.servicesUrl + '/report-create', {
            data: {
                repositoryName: this.params.repositoryName,
                branchName: this.params.branchName,
                query: this.params.query,
                filters: this.params.filters,
                sort: this.params.sort,
                format: this.formatDropdownField.getSelectedValue(),
                fields: this.fieldsField.getValue(),
                reportName: reportName
            }
        })
            .then((result) => handleTaskCreation(result, {
                taskId: result.taskId,
                message: 'Generating report...',
                doneCallback: (success) => {
                    const archiveNameInput = new RcdInputElement().init()
                        .setAttribute('type', 'hidden')
                        .setAttribute('name', 'archiveName')
                        .setAttribute('value', success);
                    const fileNameInput = new RcdInputElement().init()
                        .setAttribute('type', 'hidden')
                        .setAttribute('name', 'fileName')
                        .setAttribute('value', reportName + '.zip');
                    const downloadForm = new RcdFormElement().init()
                        .setAttribute('action', config.servicesUrl + '/report-download')
                        .setAttribute('method', 'post')
                        .addChild(archiveNameInput)
                        .addChild(fileNameInput);
                    document.body.appendChild(downloadForm.domElement);
                    downloadForm.submit();
                    document.body.removeChild(downloadForm.domElement);
                }
            }))
            .catch(handleRequestError)
            .finally(() => infoDialog.close());
    }
}

class SearchParamsCard extends RcdDivElement {
    constructor() {
        super();
        this.searchListeners = [];
        this.repositoryMap = {};
        this.repositoryDropdown = new RcdMaterialDropdown('Repositories', []).init()
            .addChangeListener(() => {
                this.branchDropdown.clear();
                this.branchDropdown.addOption('All branches');
                const selectedRepositoryName = this.repositoryDropdown.getSelectedValue();
                if (selectedRepositoryName && selectedRepositoryName !== 'All repositories') {
                    this.branchDropdown.addOptions(this.repositoryMap[selectedRepositoryName]);
                }
            });
        this.branchDropdown = new RcdMaterialDropdown('Branches', []).init();
        this.contextRow = new RcdDivElement().init()
            .addClass('dtb-search-params-row')
            .addClass('dtb-responsive-row')
            .addChild(this.repositoryDropdown)
            .addChild(this.branchDropdown);
        this.filtersField = new RcdMaterialTextField('Filters (JSON format)', '{"exists":{"field":"modifiedTime"}}').init()
            .addClass('dtb-search-filters')
            .addKeyDownListener('Enter', () => this.search());
        this.filtersIconArea =
            new RcdGoogleMaterialIconArea('fullscreen', () => new FiltersDialog(this.filtersField).init().open()).init();
        this.filtersRow = new RcdDivElement().init()
            .addClass('dtb-search-params-row')
            .addClass('dtb-row')
            .addChild(this.filtersField)
            .addChild(this.filtersIconArea);
        this.queryField = new RcdMaterialTextField('Query', '').init()
            .addClass('dtb-search-query')
            .addKeyDownListener('Enter', () => this.search());
        this.sortField = new RcdMaterialTextField('Sort', '').init()
            .addClass('dtb-search-sort');
        this.queryRow = new RcdDivElement().init()
            .addClass('dtb-search-params-row')
            .addClass('dtb-responsive-row')
            .addChild(this.queryField)
            .addChild(this.sortField);
        this.reportButtonArea = new RcdMaterialButtonArea('Report', () => {
        }, RcdMaterialButtonType.FLAT).init()
            .addClass('dtb-search-button')
            .addClickListener(() => this.report());
        this.searchButtonArea = new RcdMaterialButtonArea('Search', () => {
        }, RcdMaterialButtonType.FLAT).init()
            .addClass('dtb-search-button')
            .addClickListener(() => this.search());
        this.buttonRow = new RcdDivElement().init()
            .addClass('dtb-action-row')
            .addChild(this.reportButtonArea)
            .addChild(this.searchButtonArea);
    }

    init() {
        return super.init()
            .addClass('dtb-search-params')
            .addChild(this.contextRow)
            .addChild(this.filtersRow)
            .addChild(this.queryRow)
            .addChild(this.buttonRow);
    }

    search() {
        const searchParams = this.getSearchParams();
        if (searchParams.filters) {
            const parsedJson = parseJson(searchParams.filters);
            if (parsedJson) {
                if (!(parsedJson instanceof Object)) {
                    displayError('Not a JSON object');
                    return;
                }
            } else {
                displayError('Invalid JSON');
                return;
            }
        }
        RcdHistoryRouter.setState('search', {
            repo: searchParams.repositoryName,
            branch: searchParams.branchName,
            query: searchParams.query,
            filters: searchParams.filters,
            sort: searchParams.sort
        });
    }

    report() {
        const searchParams = this.getSearchParams();
        const infoDialog = showShortInfoDialog('Retrieving result count...');
        return requestPostJson(config.servicesUrl + '/node-query', {
            data: {
                repositoryName: searchParams.repositoryName,
                branchNames: searchParams.branchNames,
                query: searchParams.query,
                filters: searchParams.filters,
                sort: searchParams.sort,
                count: 0
            }
        })
            .then((result) => {
                new ReportDialog(searchParams, result.success.total).init()
                    .open();
            })
            .catch((error) => handleRequestError(error) && this.resultCard.addRow('Search failure'))
            .finally(() => {
                infoDialog.close();
            });
    }

    getSearchParams() {
        const repo = this.repositoryDropdown.getSelectedValue();
        const branch = this.branchDropdown.getSelectedValue();
        const query = this.queryField.getValue();
        const sort = this.sortField.getValue();
        const filters = this.filtersField.getValue();
        return {
            repositoryName: repo === 'All repositories' ? undefined : repo,
            branchName: branch === 'All branches' ? undefined : branch,
            query: query,
            filters: filters,
            sort: sort
        };
    }

    onDisplay(repositories) {
        this.repositoryMap = {};
        this.repositoryDropdown.clear();
        this.repositoryDropdown.addOption('All repositories');
        this.branchDropdown.clear();
        this.branchDropdown.addOption('All branches');

        if (repositories && repositories.length) {
            repositories.forEach(repository => {
                this.repositoryMap[repository.name] = repository.branches;
            });

            this.repositoryDropdown.addOptions(repositories.map(repository => repository.name));

            const repoParameter = getRepoParameter();
            if (repoParameter && this.repositoryMap[repoParameter]) {
                this.repositoryDropdown.selectOption(repoParameter);
                this.branchDropdown.addOptions(this.repositoryMap[repoParameter]);

                const branchParameter = getBranchParameter();
                if (branchParameter && this.repositoryMap[repoParameter].indexOf(branchParameter) !== -1) {
                    this.branchDropdown.selectOption(branchParameter);
                }
            }
        }

        const queryParameter = getQueryParameter();
        const filtersParameter = getFiltersParameter();

        this.sortField.setValue(getSortParameter('_score DESC'));
        this.filtersField.setValue(filtersParameter);
        this.queryField.setValue(queryParameter)
            .focus()
            .select();

        if (queryParameter || filtersParameter) {
            this.notifySearchListeners();
        }
    }

    addSearchListener(listener) {
        this.searchListeners.push(listener);
        return this;
    }

    notifySearchListeners() {
        const repositoryName = this.repositoryDropdown.getSelectedValue();
        const branchName = this.branchDropdown.getSelectedValue();
        const params = {
            repositoryName: repositoryName === 'All repositories' ? null : repositoryName,
            branchName: branchName === 'All branches' ? null : branchName,
            query: this.queryField.getValue(),
            filters: this.filtersField.getValue(),
            sort: this.sortField.getValue(),
            start: getStartParameter(),
            count: getCountParameter(20)
        };
        this.searchListeners.forEach((listener) => listener(params));
    }
}

class SearchRoute extends DtbRoute {
    constructor() {
        super({
            state: 'search',
            name: 'Node Search',
            iconArea: new RcdGoogleMaterialIconArea('search').init()
        });
    }

    onDisplay() {
        this.refreshBreadcrumbs();
        this.layout.removeChild(this.resultCard);
        this.retrieveRepositories();
    }

    createLayout() {
        this.paramsCard = new SearchParamsCard()
            .init()
            .addSearchListener((params) => this.onSearchAction(params));
        this.resultCard = new RcdMaterialList()
            .init()
            .addClass('dtb-search-result');

        return new RcdMaterialLayout()
            .init()
            .addChild(this.paramsCard);
    }

    retrieveRepositories() {
        const infoDialog = showShortInfoDialog('Retrieving repositories...');
        this.resultCard.clear();
        return requestJson(config.servicesUrl + '/repository-list')
            .then((result) => this.paramsCard.onDisplay(result.success))
            .catch((error) => handleRequestError(error) && this.paramsCard.onDisplay([]))
            .finally(() => infoDialog.close());
    }

    onSearchAction(params) {
        const infoDialog = showShortInfoDialog('Querying nodes...');
        this.resultCard.clear();
        return requestPostJson(config.servicesUrl + '/node-query', {
            data: params
        })
            .then((result) => this.onNodesRetrieval(result))
            .catch((error) => handleRequestError(error) && this.resultCard.addRow('Search failure'))
            .finally(() => {
                this.layout.addChild(this.resultCard);
                infoDialog.close();
            });
    }

    onNodesRetrieval(result) {
        if (result.success.count === 0) {
            this.resultCard.addRow('No node found');
        } else {
            result.success.hits.forEach(node => {
                const primary = node._name;
                const secondary = node.repositoryName + ':' + node.branchName + ':' + node._path +
                                  (node._score ? ('<br/>Score: ' + node._score.toFixed(5)) : '');
                this.resultCard.addRow(primary, secondary, {
                    callback: () => setState('node', {repo: node.repositoryName, branch: node.branchName, id: node._id})
                });
            });
        }
        this.resultCard.addChild(this.createResultCardFooter(result));
    }

    createResultCardFooter(result) {
        const startInt = parseInt(getStartParameter());
        const countInt = parseInt(getCountParameter(20));
        const rowCountCallback = (rowCount) => setState('search', {
            repo: getRepoParameter(),
            branch: getBranchParameter(),
            filters: getFiltersParameter(),
            query: getQueryParameter(),
            start: getStartParameter(),
            count: rowCount,
            sort: getSortParameter('_score DESC')
        });
        const previousCallback = () => setState('search', {
            repo: getRepoParameter(),
            branch: getBranchParameter(),
            filters: getFiltersParameter(),
            query: getQueryParameter(),
            start: Math.max(0, startInt - countInt),
            count: getCountParameter(20),
            sort: getSortParameter('_score DESC')
        });
        const nextCallback = () => setState('search', {
            repo: getRepoParameter(),
            branch: getBranchParameter(),
            filters: getFiltersParameter(),
            query: getQueryParameter(),
            start: startInt + countInt,
            count: getCountParameter(20),
            sort: getSortParameter('_score DESC')
        });
        return new RcdMaterialTableCardFooter({
            rowCount: parseInt(getCountParameter(20)),
            start: parseInt(getStartParameter()),
            count: result.success.hits.length,
            total: result.success.total,
            rowCountCallback: rowCountCallback,
            previousCallback: previousCallback,
            nextCallback: nextCallback
        }).init();
    }

    refreshBreadcrumbs() {
        this.breadcrumbsLayout.setBreadcrumbs([new RcdMaterialBreadcrumb('Data Toolbox').init().setStateRef(''),
            new RcdMaterialBreadcrumb('Search').init()]);
    }

    displayHelp() {
        const viewDefinition = 'Query nodes, from all your repositories or a specific context, using the <a class="rcd-material-link" href="https://developer.enonic.com/docs/xp/stable/storage/noql">Node Query Language</a> or <a class="rcd-material-link" href="https://developer.enonic.com/docs/xp/stable/storage/filters">Filters</a>.';
        const reportDescription = 'Report: Generate a report of the query result.' +
                                  '<br/>Format "Node as JSON tree": Generate the matching nodes as JSON in a tree structure' +
                                  '<br/>Format "Node fields as TSV": Generate the fields of the matching nodes in a TSV (Tab-Separated Values) file';
        new HelpDialog('Search', [viewDefinition, reportDescription]).init().open();
    }
}
