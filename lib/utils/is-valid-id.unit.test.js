const testHelpers = require('@quoin/node-test-helpers');

const moduleToTest = require('./is-valid-id');

const expect = testHelpers.expect;

describe("lib/is-valid-id", () => {
    it("should expose a function", () => {
        expect(moduleToTest).to.be.a('function');
    });

    it("should accept 1 param", () => {
        expect(moduleToTest).to.have.lengthOf(1);
    });

    it("should be false if no params", () => {
        expect(moduleToTest()).to.be.false();
    });

    it("should be false for null", () => {
        expect(moduleToTest(null)).to.be.false();
    });

    it("should be false for string", () => {
        expect(moduleToTest('1')).to.be.false();
    });

    it("should be true for number", () => {
        expect(moduleToTest(1)).to.be.true();
    });

    it("should be true for 0 (zero)", () => {
        expect(moduleToTest(0)).to.be.true();
    });

    it("should be true for negative number", () => {
        expect(moduleToTest(-1)).to.be.true();
    });
});
