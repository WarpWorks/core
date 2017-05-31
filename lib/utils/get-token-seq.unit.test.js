const testHelpers = require('@quoin/node-test-helpers');

const moduleToTest = require('./get-token-seq');
const WarpWorksError = require('./../error');

const expect = testHelpers.expect;

describe("lib/utils/get-token-seq", () => {
    it("should expose a function with 3 params", () => {
        expect(moduleToTest).to.be.a('function').to.have.lengthOf(3);
    });

    it("should be a function with 3 params", () => {
        expect(moduleToTest).to.be.a('function').to.have.lengthOf(3);
    });

    it("should throw when no params", () => {
        expect(() => moduleToTest()).to.throw(TypeError);
    });

    it("should return empty array when only 1 empty param", () => {
        expect(moduleToTest('')).to.deep.equal([]);
    });

    it("should not be a tag value when only 1 param", () => {
        expect(moduleToTest('foo')).to.deep.equal([{
            value: 'foo',
            isTagValue: false
        }]);
    });

    it("should throw when closeTag found, but not openTag", () => {
        expect(() => moduleToTest('foo</p>', '<p>', '</p>'))
                .to.throw(WarpWorksError, "Missing opening tag '<p>'!");
    });

    it("should throw when openTag found, but not closeTag", () => {
        expect(() => moduleToTest('foo<p>', '<p>', '</p>'))
                .to.throw(WarpWorksError, "Missing closing tag '</p>'!");
    });

    it("should throw when openTag found twice, but not closeTag twice", () => {
        expect(() => moduleToTest('<p></p>foo<p>', '<p>', '</p>'))
                .to.throw(WarpWorksError, "Missing closing tag '</p>'!");
    });

    it("should detect double openTag", () => {
        expect(() => moduleToTest('<p>foo<p>bar</p>', '<p>', '</p>'))
                .to.throw(WarpWorksError, "");
    });

    it("should handle 'foo<p></p>'", () => {
        expect(moduleToTest('foo<p></p>', '<p>', '</p>')).to.deep.equal([{
            value: 'foo',
            isTagValue: false
        }]);
    });

    it("should handle '<p>foo</p>'", () => {
        expect(moduleToTest('<p>foo</p>', '<p>', '</p>')).to.deep.equal([{
            value: 'foo',
            isTagValue: true
        }]);
    });

    it("should handle '<p>foo</p>bar'", () => {
        expect(moduleToTest('<p>foo</p>bar', '<p>', '</p>')).to.deep.equal([{
            value: 'foo',
            isTagValue: true
        }, {
            value: 'bar',
            isTagValue: false
        }]);
    });
});
