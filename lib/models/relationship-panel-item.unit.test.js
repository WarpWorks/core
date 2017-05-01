const testHelpers = require('@quoin/node-test-helpers');

const moduleToTest = require('./relationship-panel-item');

const expect = testHelpers.expect;

describe("lib/models/relationship-panel-item", () => {
    it("should expose a class with 5 params", () => {
        expect(moduleToTest).to.be.a('function')
            .to.have.lengthOf(5)
            .to.have.property('name').to.equal('RelationshipPanelItem');
    });
});
