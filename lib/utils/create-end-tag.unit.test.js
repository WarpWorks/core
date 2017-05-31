const testHelpers = require('@quoin/node-test-helpers');

const moduleToTest = require('./create-end-tag');

const expect = testHelpers.expect;

describe("lib/utils/create-end-tag", () => {
    it("should expose a function with 2 params", () => {
        expect(moduleToTest).to.be.a('function').to.have.lengthOf(2);
    });

    it("should create tag with only 1 param", () => {
        expect(moduleToTest('hello')).to.equal('{{/hello}}');
    });

    it("should create tag with 2 params: false", () => {
        expect(moduleToTest('hello', false)).to.equal('{{/hello}}');
    });

    it("should create tag with 2 params: true", () => {
        expect(moduleToTest('hello', true)).to.equal('{{/hello?}}');
    });
});
