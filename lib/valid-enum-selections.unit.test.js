const _ = require('lodash');
const testHelpers = require('@quoin/node-test-helpers');

const moduleToTest = require('./valid-enum-selections');

const expect = testHelpers.expect;

describe("lib/valid-enum-selections", () => {
    it("should expose an object", () => {
        expect(moduleToTest).to.be.an('object');
    });

    it("should expose known properties", () => {
        const clone = _.clone(moduleToTest);

        testHelpers.verifyProperties(clone, 'string', [
            'One',
            'ZeroOne',
            'ZeroMany',
            'OneMany'
        ]);

        expect(clone).to.deep.equal({});
    });
});
