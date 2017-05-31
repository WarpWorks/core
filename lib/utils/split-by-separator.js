module.exports = (str, separator) => {
    var res = [];
    if (!str.includes(separator)) {
        return [str];
    }
    res[0] = str.split(separator, 1)[0];
    res[1] = str.slice(res[0].length + separator.length);
    return res;
};
