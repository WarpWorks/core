const createBeginTag = require('./create-begin-tag');
const createEndTag = require('./create-end-tag');
const extractTagValue = require('./extract-tag-value');
const getDir = require('./get-dir');
const getTokenSeq = require('./get-token-seq');
const isValidID = require('./is-valid-id');
const mapJSON = require('./map-json');
const splitBySeparator = require('./split-by-separator');

module.exports = {
    createBeginTag,
    createEndTag,
    extractTagValue,
    getDir,
    getTokenSeq,
    isValidID,
    mapJSON,
    splitBySeparator
};
