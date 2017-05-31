const _ = require('lodash');
const testHelpers = require('@quoin/node-test-helpers');

const warpCore = require('./index');

const expect = testHelpers.expect;

describe("lib/index", () => {
    it("should be an instance", () => {
        expect(warpCore).to.be.an.instanceof(warpCore.constructor);
    });

    it("should expose known properties", () => {
        const clone = _.clone(warpCore);

        testHelpers.verifyProperties(clone, 'function', [
            'applyTemplateFile',
            'createDomainFromJSON',
            'createDomainFromJSONString',
            'createInstanceFromJSON',
            'createModel',
            'createModelElementsFromSMN',
            'createNewDomain',
            'domainFiles',
            'expireDomainCache',
            'getAllDomains',
            'getDir',
            'getDomainByName',
            'parseSMN',
            'readDir',
            'readFile',
            'removeAllDataFromDB',
            'smnFiles',
            'useDB'
        ]);

        testHelpers.verifyProperties(clone, 'string', [
            'version'
        ]);

        testHelpers.verifyProperties(clone, null, [
            'config',
            'domains',
            'mongoDBs',
            'parent'
        ]);

        expect(clone).to.deep.equal({});
    });

    describe("createNewDomain()", () => {
        it("should be a function with 3 params", () => {
            expect(warpCore).to.have.property('createNewDomain')
                .to.be.a('function').to.have.lengthOf(3);
        });

        it("should create and return a new domain", () => {
            const domain = warpCore.createNewDomain('aName', 'aDescription', false);
            expect(domain).to.be.an.instanceof(domain.constructor);
            expect(domain.constructor.name).to.equal('Domain');
        });
    });

    describe("getAllDomains()", () => {
        it("should be a function with no params", () => {
            expect(warpCore).to.have.property('getAllDomains')
                .to.be.a('function').to.have.length(0);
        });

        it("should return `this.domains`", () => {
            expect(warpCore.getAllDomains()).to.deep.equal(warpCore.domains);
        });
    });

    describe("getDomainByName()", () => {
        it("should be a function with 1 param", () => {
            expect(warpCore).to.have.property('getDomainByName')
                .to.be.a('function').to.have.lengthOf(1);
        });

        it("should fail for unknown domain", () => {
            expect(() => warpCore.getDomainByName('foo')).to.throw();
        });
    });

    describe("toString()", () => {
        it("should be a function with no params", () => {
            expect(warpCore).to.have.property('toString')
                .to.be.a('function').to.have.lengthOf(0);
        });

        it("should return representation", () => {
            expect(warpCore.toString()).to.be.a('string');
        });
    });

    describe("getDir()", () => {
        it("should be a function with 2 params", () => {
            expect(warpCore).to.have.property('getDir')
                .to.be.a('function').to.have.lengthOf(2);
        });

        it("should throw when no params", () => {
            expect(() => warpCore.getDir()).to.throw(Error, "a");
        });

        it("should return path for 'smnDemos'", () => {
            const value = warpCore.getDir('smnDemos');
            expect(value).to.be.a('string');
        });

        it("should return path for 'templates'", () => {
            const value = warpCore.getDir('templates');
            expect(value).to.be.a('string');
        });

        it("should return path for 'output'", () => {
            const value = warpCore.getDir('output');
            expect(value).to.be.a('string');
        });
    });

    describe("readFile()", () => {
        it("should be a function with 1 param", () => {
            expect(warpCore).to.have.property('readFile')
                .to.be.a('function').to.have.lengthOf(1);
        });

        it("should throw when no params", () => {
            expect(() => warpCore.readFile()).to.throw(Error);
        });
    });
});
