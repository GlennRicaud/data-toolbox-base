exports.runSafely = function (runnable, parameters, errorMessage) {
    try {
        return runnable.apply(null, parameters);
    } catch (e) {
        return {
            error: errorMessage + ': ' + e.message
        }
    }
}