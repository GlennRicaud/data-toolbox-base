function forceArray(o) {
    if (Array.isArray(o)) {
        return o;
    }
    return o == null ? [] : [o];
}

function runSafely(runnable, parameters, messagePrefix = 'Error') {
    try {
        return runnable.apply(null, parameters);
    } catch (e) {
        const errorMessage = messagePrefix + ': ' + (e.message || e);
        log.error(errorMessage);
        return {
            error: errorMessage
        }
    }
}

exports.forceArray = forceArray;
exports.runSafely = runSafely;