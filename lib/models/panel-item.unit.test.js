const testHelpers = require('@quoin/node-test-helpers');

const moduleToTest = require('./panel-item');

const expect = testHelpers.expect;

describe("lib/models/panel-item", () => {
    it("should expose a class", () => {
        expect(moduleToTest).to.be.a('function')
            .to.have.lengthOf(6)
            .to.have.property('name').to.equal('PanelItem');
    });
});
