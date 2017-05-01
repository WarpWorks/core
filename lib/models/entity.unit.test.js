const testHelpers = require('@quoin/node-test-helpers');

const moduleToTest = require('./entity');

const expect = testHelpers.expect;

describe("lib/models/entity", () => {
    it("should expose a class with 7 params", () => {
        expect(moduleToTest).to.be.a('function')
            .to.have.lengthOf(7)
            .to.have.property('name').to.equal('Entity');
    });
});
