const testHelpers = require('@quoin/node-test-helpers');

const moduleToTest = require('./literal');

const expect = testHelpers.expect;

describe("lib/models/literal", () => {
    it("should expose a class with 4 params", () => {
        expect(moduleToTest).to.be.a('function')
            .to.have.lengthOf(4)
            .to.have.property('name').to.equal('Literal');
    });
});
