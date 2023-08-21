exports.escapeHtml = function (object) {
    for (var attributeName in object) {
        const attributeValue = object[attributeName];
        if (typeof attributeValue === "string") {
            object[attributeName] = Java.type("systems.rcd.enonic.datatoolbox.RcdEscapeUtils").escapeHtml(attributeValue);
        } else if (typeof attributeValue === "object") {
            object[attributeName] = exports.escapeHtml(attributeValue);
        }
    }
    return object;
};