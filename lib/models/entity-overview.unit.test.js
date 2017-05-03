const testHelpers = require('@quoin/node-test-helpers');

const moduleToTest = require('./entity-overview');

const expect = testHelpers.expect;

describe("lib/models/entity-overview", () => {
    it("should expose a function", () => {
        expect(moduleToTest).to.be.a('function')
            .to.have.lengthOf(4);
    });
});
