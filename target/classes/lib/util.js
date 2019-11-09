function forceArray(o) {
    if (Array.isArray(o)) {
        return o;
    }
    return o == null ? [] : [o];
}

exports.forceArray = forceArray;