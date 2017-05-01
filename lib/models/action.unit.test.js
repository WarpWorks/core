const testHelpers = require('@quoin/node-test-helpers');

const moduleToTest = require('./action');

const expect = testHelpers.expect;

describe("lib/models/action", () => {
    it("should expose a class with 4 params", () => {
        expect(moduleToTest).to.be.a('function')
            .to.have.lengthOf(4)
            .to.have.property('name').to.equal('Action');
    });

    describe("Action()", () => {
        describe("constructor", () => {
        });
    });
});
