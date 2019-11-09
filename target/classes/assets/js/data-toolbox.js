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
        .addRoute(new AboutRoute().init());
}

function handleResultError(result) {
    if (result.error) {
        console.log(result.error);
        displaySnackbar(result.error);
        return false;
    }
    return true;
}

function displaySnackbar(text) {
    new RcdMaterialSnackbar(text)
        .init()
        .open();
}

function handleAjaxError(jqXHR, textStatus, errorThrown) {
    let errorMessage;
    if (jqXHR.status) {
        if (jqXHR.status === 200) {
            errorMessage = 'Error: ' + textStatus;
        } else {
            errorMessage = 'Error ' + jqXHR.status + ': ' + jqXHR.statusText;
        }
    } else {
        errorMessage = 'Connection refused';
    }
    console.log(errorMessage);
    if (errorThrown) {
        console.log(errorThrown);
    }
    new RcdMaterialSnackbar(errorMessage).init().open();
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

function getRepoParameter() {
    return RcdHistoryRouter.getParameters().repo;
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

function getStartParameter() {
    return RcdHistoryRouter.getParameters().start || '0';
}

function getCountParameter(defaultValue) {
    return RcdHistoryRouter.getParameters().count || defaultValue || '50';
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

function getPropertyParameter() {
    return RcdHistoryRouter.getParameters().property;
}

var app = createApp();
app.start(document.body);