/*
 * Polyfill for String.endsWith taken from
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/endsWith
 * This method has been added to the ECMAScript 6 specification and may not be available in all JavaScript implementations yet. However, you can polyfill String.prototype.endsWith() with the following snippet:
 */
if (!String.prototype.endsWith) {
    String.prototype.endsWith = function (searchString, position) {
        var subjectString = this.toString();
        if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
            position = subjectString.length;
        }
        position -= searchString.length;
        var lastIndex = subjectString.lastIndexOf(searchString, position);
        return lastIndex !== -1 && lastIndex === position;
    };
}

/*
 * Polyfill for String.startsWith taken from
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/startsWith
 */
if (!String.prototype.startsWith) {
    String.prototype.startsWith = function(searchString, position){
        position = position || 0;
        return this.substr(position, searchString.length) === searchString;
    };
}

if (!String.prototype.contains) {
    String.prototype.contains = function (needle) {
        var subjectString = this.toString();
        return subjectString.indexOf(needle) > -1;
    };
}