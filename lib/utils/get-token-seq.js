const extractTagValue = require('./extract-tag-value');
const WarpWorksError = require('./../error');

module.exports = (str, openTag, closeTag) => {
    // Parse str for tagValues enclosed between openTag and closeTag
    // Returns array of tokens as follows: { value: "text", isTagValue: true|false }
    var tokenSeq = [];
    while (str.includes(openTag)) {
        var bs = extractTagValue(str, openTag, closeTag);
        if (bs[0].length > 0) {
            tokenSeq.push({ value: bs[0], isTagValue: false });
        }
        if (bs[1].length > 0) {
            if (bs[1].includes(openTag)) {
                throw new WarpWorksError("Opening tag '" + openTag + "' must be followed by closing tag '" + closeTag + "' before next opening tag!");
            }
            tokenSeq.push({value: bs[1], isTagValue: true});
        }
        str = bs[2];
    }
    if (str.length > 0) {
        if (str.includes(closeTag)) {
            throw new WarpWorksError("Missing opening tag '" + openTag + "'!");
        }
        tokenSeq.push({value: str, isTagValue: false});
    }

    return tokenSeq;
};
