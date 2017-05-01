const testHelpers = require('@quoin/node-test-helpers');

const moduleToTest = require('./table-item');

const expect = testHelpers.expect;

describe("lib/models/table-item", () => {
    it("should expose a class with 5 params", () => {
        expect(moduleToTest).to.be.a('function')
            .to.have.lengthOf(5)
            .to.have.property('name').to.equal('TableItem');
    });
});
