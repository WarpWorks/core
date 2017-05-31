function lineReducer(memo, line) {
    const noCommentLine = line.replace(/\/\/.*$/, '');

    if (noCommentLine.length) {
        if (noCommentLine[0] === '-') {
            memo[memo.length - 1] = [memo[memo.length - 1], noCommentLine.substr(1)].join(',');
        } else {
            memo.push(noCommentLine);
        }
    }

    return memo;
}

function parse(smn) {
    const lines = smn.replace(/ /g, '').split('\n');
    const smnFileMerged = lines.reduce(lineReducer, []);
    return smnFileMerged;
}

module.exports = {
    parse
};
