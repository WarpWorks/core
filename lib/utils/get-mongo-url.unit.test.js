const testHelpers = require('@quoin/node-test-helpers');

const moduleToTest = require('./get-mongo-url');

const expect = testHelpers.expect;

describe("lib/utils/get-mongo-url", () => {
    const CONFIG = {
        mongoServer: 'localhost'
    };

    it("should expose a function with 2 params", () => {
        expect(moduleToTest).to.be.a('function').to.have.lengthOf(2);
    });

    it("should throw when no params", () => {
        expect(() => moduleToTest()).to.throw();
    });

    it("should return url without dbName", () => {
        expect(moduleToTest(CONFIG)).to.equal('mongodb://localhost/undefined');
    });

    it("should return url with dbName", () => {
        expect(moduleToTest(CONFIG, 'foo')).to.equal('mongodb://localhost/foo');
    });
});
