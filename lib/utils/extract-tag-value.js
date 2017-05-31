const WarpWorksError = require('./../error');

module.exports = (str, openTag, closeTag) => {
    // Returns array with header, tag value (value between openTag and closeTag), footer
    // Only extracts first tag value

    var pos1 = str.indexOf(openTag);
    var pos2 = str.indexOf(closeTag);

    if (pos1 === -1) {
        throw new WarpWorksError(`Missing opening tag '${openTag}'!`);
    } else if (pos2 === -1) {
        throw new WarpWorksError(`Missing closing tag '${closeTag}'!`);
    } else if (pos1 > pos2) {
        throw new WarpWorksError(`Opening tag '${openTag}' must come before closing tag '${closeTag}'!`);
    }

    return [
        str.slice(0, pos1),
        str.slice(pos1 + openTag.length, pos2),
        str.slice(pos2 + closeTag.length)
    ];
};
