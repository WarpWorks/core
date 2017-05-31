const testHelpers = require('@quoin/node-test-helpers');

const moduleToTest = require('./map-json');

const expect = testHelpers.expect;

describe("lib/utils/map-json", () => {
    it("should expose a function with 1 param", () => {
        expect(moduleToTest).to.be.a('function').to.have.lengthOf(1);
    });

    it("should return empty list when empty", () => {
        const value = [];
        const result = moduleToTest(value);
        expect(result).to.deep.equal([]);
    });

    it("should call '.toJSON()' of object in list", () => {
        const item = {
            toJSON: testHelpers.stub()
        };

        const value = [item];
        moduleToTest(value);

        expect(item.toJSON).to.have.been.called();
    });

    it("should call '.toJSON()' of object in list", () => {
        const item1 = {
            toJSON: testHelpers.stub()
        };
        const item2 = {
            toJSON: testHelpers.stub()
        };

        const value = [item1, item2];
        moduleToTest(value);

        expect(item1.toJSON).to.have.been.called();
        expect(item2.toJSON).to.have.been.called();
    });

    it("should return expected results", () => {
        const value = [{
            toJSON() {
                return { foo: 'bar' };
            }
        }, {
            toJSON() {
                return { hello: 'world' };
            }
        }];
        const result = moduleToTest(value);

        expect(result).to.deep.equal([
                {foo: 'bar'},
                {hello: 'world'}
        ]);
    });
});
