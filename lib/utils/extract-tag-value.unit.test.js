const testHelpers = require('@quoin/node-test-helpers');

const moduleToTest = require('./extract-tag-value');
const WarpWorksError = require('./../error');

const expect = testHelpers.expect;

describe("lib/utils/extract-tag-value", () => {
    it("should expose a function with 3 params", () => {
        expect(moduleToTest).to.be.a('function').to.have.lengthOf(3);
    });

    it("should throw when no params", () => {
        expect(() => moduleToTest()).to.throw(TypeError);
    });

    it("should throw when only 1 param", () => {
        expect(() => moduleToTest('foo'))
                .to.throw(WarpWorksError, "Missing opening tag 'undefined'!");
    });

    it("should throw when only 2 params", () => {
        expect(() => moduleToTest('foo', 'bar'))
                .to.throw(WarpWorksError, "Missing opening tag 'bar'!");
    });

    it("should throw when `openTag` not found", () => {
        expect(() => moduleToTest('foo', 'bar', ''))
                .to.throw(WarpWorksError, "Missing opening tag 'bar'!");
    });

    it("should throw when `closeTag` node found", () => {
        expect(() => moduleToTest('<p>foo', '<p>', '</p>'))
                .to.throw(WarpWorksError, "Missing closing tag '</p>'!");
    });

    it("should throw when `closeTag` found before `openTag`", () => {
        expect(() => moduleToTest('</p>foo<p>', '<p>', '</p>'))
                .to.throw(WarpWorksError, "Opening tag '<p>' must come before closing tag '</p>'!");
    });

    it("should find content for `<p>foo</p>`", () => {
        const value = moduleToTest('<p>foo</p>', '<p>', '</p>');
        expect(value).to.deep.equal([
            "",
            "foo",
            ""
        ]);
    });

    it("should find content for `<p></p>foo</p>`", () => {
        const value = moduleToTest('<p></p>foo</p>', '<p>', '</p>');
        expect(value).to.deep.equal([
            "",
            "",
            "foo</p>"
        ]);
    });

    it("should handle '<p>foo<p>bar</p>'", () => {
        expect(moduleToTest('<p>foo<p>bar</p>', '<p>', '</p>')).to.deep.equal([
            '',
            'foo<p>bar',
            ''
        ]);
    });
});
