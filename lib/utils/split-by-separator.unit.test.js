const testHelpers = require('@quoin/node-test-helpers');

const moduleToTest = require('./split-by-separator');

const expect = testHelpers.expect;

describe("lib/utils/split-by-separator", () => {
    it("should expose a function with 2 params", () => {
        expect(moduleToTest).to.be.a('function').to.have.lengthOf(2);
    });

    it("should throw when no params", () => {
        expect(() => moduleToTest()).to.throw(TypeError);
    });

    it("should return whole string when 1 param", () => {
        expect(moduleToTest('foo')).to.deep.equal(["foo"]);
    });

    it("should return whole string when separator not found", () => {
        expect(moduleToTest('foo', 'bar')).to.deep.equal(["foo"]);
    });

    it("should return 2 strings when separator found", () => {
        expect(moduleToTest('foo:bar', ':')).to.deep.equal(["foo", "bar"]);
    });
});
