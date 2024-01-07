function createApp() {
    return new RcdMaterialSinglePageApplication({
        title: 'Data toolbox',
        search: (value) => {
            const query = '_id = "' + value + '" OR ' +
                          '_versionkey = "' + value + '" OR ' +
                          '_path LIKE "' + value + '*" OR ' +
                          'ngram("_alltext", "' + value + '", "AND")';
            setState('search', {query: query});
        }
    })
        .init()
        .setDefaultRoute(createPresentationRoute())
        .addRoute(new RepositoriesRoute().init())
        .addRoute(new ContentsRoute().init())
        .addRoute(new ProjectsRoute().init())
        .addRoute(new BranchesRoute().init())
        .addRoute(new NodesRoute().init())
        .addRoute(new NodeRoute().init())
        .addRoute(new MetaRoute().init())
        .addRoute(new PropertiesRoute().init())
        .addRoute(new PermissionsRoute().init())
        .addRoute(new VersionsRoute().init())
        .addRoute(new SnapshotsRoute().init())
        .addRoute(new ExportsRoute().init())
        .addRoute(new DumpsRoute().init())
        .addRoute(new SearchRoute().init())
        .addRoute(new AnalyzeRoute().init())
        .addRoute(new AuditRoute().init())
        .addRoute(new IamRoute().init())
        .addRoute(new UsersRoute().init())
        .addRoute(new GroupsRoute().init())
        .addRoute(new TasksRoute().init())
        .addRoute(new EventsRoute().init())
        .addRoute(new HomeRoute().init())
        .addRoute(new AboutRoute().init());
}

function requestPostJson(url, params) {
    if (!params) {
        params = {};
    }
    params.method = 'POST';
    if (!params.headers) {
        params.headers = {};
    }
    params.headers['Content-Type'] = 'application/json';
    if (params.data) {
        params.body = JSON.stringify(params.data);
    }
    return requestJson(url, params);
}

function requestJson(url, params) {
    return request(url, params)
        .then(response => response.json())
        .then(handleJsonResponse);
}

function request(url, params) {
    if (!params) {
        params = {};
    }
    params.credentials = 'same-origin';
    return fetch(url, params)
        .then(handleFetchResponse);
}

function handleFetchResponse(response) {
    if (!response.ok) {
        const errorMessage = 'Error ' + response.status + ': ' + response.statusText;
        throw errorMessage;
    }
    return response;
}

function handleJsonResponse(result) {
    if (result.error) {
        throw result.error;
    }
    return result;
}

function handleRequestError(error) {
    displayError(error);
}

function showLongInfoDialog(text) {
    return new RcdMaterialInfoDialog({text: text, overlay: true})
        .init()
        .open();
}

function showShortInfoDialog(text) {
    return new RcdMaterialInfoDialog({text: text})
        .init()
        .open();
}

function showConfirmationDialog(text, confirmationLabel, callback) {
    return new RcdMaterialConfirmationDialog({text: text, confirmationLabel: confirmationLabel, callback: callback})
        .init()
        .open();
}

function showInputDialog(params) {
    return new RcdMaterialInputDialog(params)
        .init()
        .open();
}

function showSelectionDialog(params) {
    return new RcdMaterialSelectionDialog(params)
        .init()
        .open();
}

function showDetailsDialog(title, text, callback) {
    return new RcdMaterialDetailsDialog({title: title, text: text, callback: callback})
        .init()
        .open();
}

function setState(state, params) {
    for (let paramKey in params) {
        if (params[paramKey] == null) {
            delete params[paramKey];
        }
    }
    RcdHistoryRouter.setState(state, params);
}

function buildStateRef(state, params) {
    return '#' + buildState(state, params);
}

function buildState(state, params) {
    for (let paramKey in params) {
        if (params[paramKey] == null) {
            delete params[paramKey];
        }
    }
    return RcdHistoryRouter.buildState(state, params);
}

function getRepoParameter() {
    return RcdHistoryRouter.getParameters().repo;
}

function getProjectParameter() {
    return RcdHistoryRouter.getParameters().project;
}

function getBranchParameter() {
    return RcdHistoryRouter.getParameters().branch;
}

function getKeyParameter() {
    return getIdParameter() || getPathParameter();
}

function getIdParameter() {
    return RcdHistoryRouter.getParameters().id;
}

function getPathParameter() {
    return RcdHistoryRouter.getParameters().path;
}

function getParentPathParameter() {
    const path = getPathParameter();
    if (path === '/') {
        return '/';
    }
    const pathElements = path.split('/');
    if (pathElements.length < 3) {
        return '/';
    }
    return pathElements.slice(0, pathElements.length - 1).join('/');
}

function getIdProviderParameter() {
    return RcdHistoryRouter.getParameters().idprovider;
}

function getStartParameter() {
    return RcdHistoryRouter.getParameters().start || '0';
}

function getCountParameter(defaultValue) {
    return RcdHistoryRouter.getParameters().count || defaultValue || '50';
}

function getFieldsParameter() {
    return RcdHistoryRouter.getParameters().fields || '_id%2C_name';
}

function getFields() {
    return decodeURIComponent(getFieldsParameter()).split(',').map(fieldName => fieldName.trim());
}

function getFilterParameter() {
    return RcdHistoryRouter.getParameters().filter || '';
}

function getQueryParameter() {
    return RcdHistoryRouter.getParameters().query || '';
}

function getSortParameter(defaultValue) {
    return RcdHistoryRouter.getParameters().sort || defaultValue || '';
}

function getFiltersParameter(defaultValue) {
    return RcdHistoryRouter.getParameters().filters || defaultValue || '';
}

function getPropertyParameter() {
    return RcdHistoryRouter.getParameters().property;
}

function getApplicationParameter() {
    return RcdHistoryRouter.getParameters().application;
}

function getAnalyzerParameter() {
    return RcdHistoryRouter.getParameters().analyzer || '';
}

function getFieldParameter() {
    return RcdHistoryRouter.getParameters().field || '';
}

function getTextParameter() {
    return RcdHistoryRouter.getParameters().text || '';
}

