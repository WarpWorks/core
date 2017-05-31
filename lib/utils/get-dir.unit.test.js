const testHelpers = require('@quoin/node-test-helpers');

const moduleToTest = require('./get-dir');
const WarpWorksError = require('./../error');

const expect = testHelpers.expect;

describe("lib/get-dir", () => {
    const CONFIG = {
        projectPath: '/project',
        cartridgePath: '/cartridge',
        outputPath: '/output'
    };

    const NAMES = {
        SMN_DEMOS: 'smnDemos',
        TEMPLATES: 'templates',
        DOMAINS: 'domains',
        OUTPUT: 'output'
    };

    it("should expose a function", () => {
        expect(moduleToTest).to.be.a('function');
    });

    it("should accept 3 params", () => {
        expect(moduleToTest).to.have.lengthOf(3);
    });

    it("should fail if no args", () => {
        expect(() => moduleToTest()).to.throw();
    });

    it("should fail if 'name' is not defined", () => {
        expect(() => moduleToTest(CONFIG)).to.throw(WarpWorksError, "Invalid directory: 'undefined'");
    });

    it("should fail if 'name' is unknown", () => {
        expect(() => moduleToTest(CONFIG, 'foo')).to.throw(WarpWorksError, "Invalid directory: 'foo'");
    });

    describe(NAMES.DOMAINS, () => {
        it("should return smnDemos path", () => {
            const value = moduleToTest(CONFIG, NAMES.DOMAINS);
            expect(value).to.equal('/project/domains');
        });

        it("should return smnDemos path plus filename", () => {
            const value = moduleToTest(CONFIG, NAMES.DOMAINS, 'foo');
            expect(value).to.equal('/project/domains/foo');
        });
    });

    describe(NAMES.OUTPUT, () => {
        it("should return smnDemos path", () => {
            const value = moduleToTest(CONFIG, NAMES.OUTPUT);
            expect(value).to.equal('/output');
        });

        it("should return smnDemos path plus filename", () => {
            const value = moduleToTest(CONFIG, NAMES.OUTPUT, 'foo');
            expect(value).to.equal('/output/foo');
        });
    });

    describe(NAMES.SMN_DEMOS, () => {
        it("should return smnDemos path", () => {
            const value = moduleToTest(CONFIG, NAMES.SMN_DEMOS);
            expect(value).to.equal('/project/smnDemos');
        });

        it("should return smnDemos path plus filename", () => {
            const value = moduleToTest(CONFIG, NAMES.SMN_DEMOS, 'foo');
            expect(value).to.equal('/project/smnDemos/foo');
        });
    });

    describe(NAMES.TEMPLATES, () => {
        it("should return smnDemos path", () => {
            const value = moduleToTest(CONFIG, NAMES.TEMPLATES);
            expect(value).to.equal('/cartridge/templates');
        });

        it("should return smnDemos path plus filename", () => {
            const value = moduleToTest(CONFIG, NAMES.TEMPLATES, 'foo');
            expect(value).to.equal('/cartridge/templates/foo');
        });
    });
});
