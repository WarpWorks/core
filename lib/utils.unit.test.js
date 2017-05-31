const _ = require('lodash');
const testHelpers = require('@quoin/node-test-helpers');

const utils = require('./utils');

const expect = testHelpers.expect;

describe("lib/utils", () => {
    it("should export an object", () => {
        expect(utils).to.be.an('object');
    });

    it("should expose known properties", () => {
        const clone = _.clone(utils);

        testHelpers.verifyProperties(clone, 'function', [
            'createBeginTag',
            'createEndTag',
            'extractTagValue',
            'getDir',
            'getTokenSeq',
            'isValidID',
            'mapJSON',
            'splitBySeparator'
        ]);

        expect(clone).to.deep.equal({});
    });
});
