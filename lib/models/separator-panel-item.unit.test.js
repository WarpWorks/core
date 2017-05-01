const testHelpers = require('@quoin/node-test-helpers');

const moduleToTest = require('./separator-panel-item');

const expect = testHelpers.expect;

describe("lib/models/separator-panel-item", () => {
    it("should expose a class with 3 params", () => {
        expect(moduleToTest).to.be.a('function')
            .to.have.lengthOf(3)
            .to.have.property('name').to.equal('SeparatorPanelItem');
    });
});
