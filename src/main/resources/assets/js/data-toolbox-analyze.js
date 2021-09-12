class AnalyzeParamsCard extends RcdDivElement {
    constructor() {
        super();
        this.analyzeListeners = [];
        this.repositoryDropdown = new RcdMaterialDropdown('Repositories', []).init();
        this.contextRow = new RcdDivElement().init()
            .addClass('dtb-search-params-row')
            .addClass('dtb-responsive-row')
            .addChild(this.repositoryDropdown);
        this.fieldField = new RcdMaterialTextField('Field', '_alltext._stemmed_en').init()
            .addClass('dtb-search-filters')
            .addKeyDownListener('Enter', () => this.analyze());
        this.analyzerField = new RcdMaterialTextField('Analyzer (Overwrites Field)', 'norwegian').init()
            .addClass('dtb-search-filters')
            .addKeyDownListener('Enter', () => this.analyze());
        this.mappingRow = new RcdDivElement().init()
            .addClass('dtb-search-params-row')
            .addClass('dtb-responsive-row')
            .addChild(this.fieldField)
            .addChild(this.analyzerField);
        this.textField = new RcdMaterialTextField('Text', 'Quick Brown Foxes!').init()
            .addClass('dtb-search-query')
            .addKeyDownListener('Enter', () => this.analyze());
        this.valueRow = new RcdDivElement().init()
            .addClass('dtb-search-params-row')
            .addClass('dtb-row')
            .addChild(this.textField);
        this.analyzeButtonArea = new RcdMaterialButtonArea('Analyze', () => {
        }, RcdMaterialButtonType.FLAT).init()
            .addClass('dtb-search-button')
            .addClickListener(() => this.analyze());
        this.buttonRow = new RcdDivElement().init()
            .addClass('dtb-action-row')
            .addChild(this.analyzeButtonArea);
    }

    init() {
        return super.init()
            .addClass('dtb-search-params')
            .addChild(this.contextRow)
            .addChild(this.mappingRow)
            .addChild(this.valueRow)
            .addChild(this.buttonRow);
    }

    analyze() {
        const analyzeParams = this.getAnalyzeParams();
        RcdHistoryRouter.setState('analyze', {
            repo: analyzeParams.repositoryName,
            field: analyzeParams.field,
            analyzer: analyzeParams.analyzer,
            text: analyzeParams.text
        });
    }

    getAnalyzeParams() {
        return {
            repositoryName: this.repositoryDropdown.getSelectedValue(),
            field: this.fieldField.getValue(),
            analyzer: this.analyzerField.getValue(),
            text: this.textField.getValue()
        };
    }

    onDisplay(repositories) {
        this.repositoryDropdown.clear();
        if (repositories && repositories.length) {
            this.repositoryDropdown.addOptions(repositories.map(repository => repository.name));
            const repoParameter = getRepoParameter();
            if (repoParameter) {
                this.repositoryDropdown.selectOption(repoParameter);
            }
        }

        const fieldParameter = getFieldParameter();
        const analyzerParameter = getAnalyzerParameter();
        const textParameter = getTextParameter();

        this.fieldField.setValue(fieldParameter);
        this.analyzerField.setValue(analyzerParameter);
        this.textField.setValue(textParameter)
            .focus()
            .select();

        if (textParameter) {
            this.notifyAnalyzeListeners();
        }
    }

    addAnalyzeListener(listener) {
        this.analyzeListeners.push(listener);
        return this;
    }

    notifyAnalyzeListeners() {
        const params = this.getAnalyzeParams();
        this.analyzeListeners.forEach((listener) => listener(params));
    }
}

class AnalyzeRoute extends DtbRoute {
    constructor() {
        super({
            state: 'analyze',
            name: 'Analyze',
            iconArea: new RcdGoogleMaterialIconArea('search').init()
        });
    }

    onDisplay() {
        this.refreshBreadcrumbs();
        this.layout.removeChild(this.resultCard);
        this.retrieveRepositories();
    }

    createLayout() {
        this.paramsCard = new AnalyzeParamsCard()
            .init()
            .addAnalyzeListener((params) => this.onAnalyzeAction(params));
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

    onAnalyzeAction(params) {
        const infoDialog = showShortInfoDialog('Analyzing...');
        this.resultCard.clear();
        return requestPostJson(config.servicesUrl + '/analyze', {
            data: params
        })
            .then((result) => this.onAnalyzeResult(result))
            .catch((error) => handleRequestError(error) && this.resultCard.addRow('Analyze failure'))
            .finally(() => {
                this.layout.addChild(this.resultCard);
                infoDialog.close();
            });
    }

    onAnalyzeResult(result) {
        if (result.success.count === 0) {
            this.resultCard.addRow('No token');
        } else {
            result.success.tokens.forEach(token => {
                this.resultCard.addRow(token);
            });
        }
    }

    refreshBreadcrumbs() {
        this.breadcrumbsLayout.setBreadcrumbs([new RcdMaterialBreadcrumb('Data Toolbox').init().setStateRef(''),
            new RcdMaterialBreadcrumb('Analyze').init()]);
    }

    displayHelp() {
        const viewDefinition = 'Text analysis is the process of converting unstructured text, like the body of an email or a product description, into a structured format that’s optimized for search. ' +
                               'Elasticsearch performs text analysis when indexing or searching text fields.' +
                               'See <a class="rcd-material-link" href="https://developer.enonic.com/docs/xp/stable/storage/indexing">Indexing</a> for more information.';
        new HelpDialog('Analyze', [viewDefinition]).init().open();
    }
}
