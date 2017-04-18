const testHelpers = require('@quoin/node-test-helpers');

const WarpWorksError = require('./warpworks-error');

const expect = testHelpers.expect;

describe("lib/warpworks-error", () => {
    it("should export an error class", () => {
        const err = new WarpWorksError("a message");
        expect(err).to.be.an.instanceof(WarpWorksError);
        expect(err).to.be.an.instanceof(Error);
        expect(err.message).to.equal("a message");
        expect(err.originalError).to.be.undefined();
    });
});
