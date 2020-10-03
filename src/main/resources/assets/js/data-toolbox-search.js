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
        this.queryField = new RcdMaterialTextField('Query', '').init()
            .addClass('dtb-search-query');
        this.sortField = new RcdMaterialTextField('Sort', '').init()
            .addClass('dtb-search-sort');
        this.queryRow = new RcdDivElement().init()
            .addClass('dtb-search-params-row')
            .addClass('dtb-responsive-row')
            .addChild(this.queryField)
            .addChild(this.sortField);
        this.searchButtonArea = new RcdMaterialButtonArea('Search', () => {
        }, RcdMaterialButtonType.FLAT).init()
            .addClass('dtb-search-button')
            .addClickListener(() => this.search());
    }

    init() {
        return super.init()
            .addClass('dtb-search-params')
            .addChild(this.contextRow)
            .addChild(this.queryRow)
            .addChild(this.searchButtonArea)
            .addKeyUpListener('Enter', () => this.search());
    }

    search() {
        const repo = this.repositoryDropdown.getSelectedValue();
        const branch = this.branchDropdown.getSelectedValue();
        const query = this.queryField.getValue();
        const sort = this.sortField.getValue();
        RcdHistoryRouter.setState('search', {
            repo: repo === 'All repositories' ? undefined : repo,
            branch: branch === 'All branches' ? undefined : branch,
            query: query,
            sort: sort
        });
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


        this.sortField.setValue(getSortParameter('_score DESC'))
        this.queryField
            .setValue(queryParameter)
            .focus()
            .select();

        if (queryParameter) {
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
                const secondary = node.repositoryName + ':' + node.branchName + ':' + node._path;
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
            query: getQueryParameter(),
            start: getStartParameter(),
            count: rowCount,
            sort: getSortParameter('_score DESC')
        });
        const previousCallback = () => setState('search', {
            repo: getRepoParameter(),
            branch: getBranchParameter(),
            query: getQueryParameter(),
            start: Math.max(0, startInt - countInt),
            count: getCountParameter(20),
            sort: getSortParameter('_score DESC')
        });
        const nextCallback = () => setState('search', {
            repo: getRepoParameter(),
            branch: getBranchParameter(),
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
        const viewDefinition = 'Query nodes, from all your repositories or a specific context, using the <a class="rcd-material-link" href="https://developer.enonic.com/docs/xp/stable/storage#query_language">Node Query Language</a>.';
        new HelpDialog('Search', [viewDefinition]).init().open();
    }
}
