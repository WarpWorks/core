const testHelpers = require('@quoin/node-test-helpers');

const moduleToTest = require('./table-view');

const expect = testHelpers.expect;

describe("lib/models/table-view", () => {
    it("should expose a class with 4 params", () => {
        expect(moduleToTest).to.be.a('function')
            .to.have.lengthOf(4)
            .to.have.property('name').to.equal('TableView');
    });
});
