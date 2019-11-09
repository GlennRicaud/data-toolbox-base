exports.escapeHtml = function (object) {
    for (var attributeName in object) {
        var attributeValue = object[attributeName];
        if (typeof attributeValue === "string") {
            object[attributeName] = Java.type("org.apache.commons.lang.StringEscapeUtils").
                escapeHtml(attributeValue);
        } else if (typeof attributeValue === "object") {
            object[attributeName] = exports.escapeHtml(attributeValue);
        }
    }
    return object;
};