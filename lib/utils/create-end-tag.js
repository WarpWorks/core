module.exports = (tagName, conditional) => {
    if (conditional) {
        return '{{/' + tagName + '?}}';
    } else {
        return "{{/" + tagName + "}}";
    }
};
