const _ = require('lodash');
const Promise = require('bluebird');

function basicPropertiesToKeys(obj) {
    let basicProperties = _.reduce(
        obj.basicProperties,
        (memo, value, key) => {
            if (!_.isArray(value)) {
                return _.extend(memo, {
                    [value.name]: value.value
                });
            }
            return memo;
        },
        {}
    );
    return Object.assign(obj, basicProperties);
}

function initResultObject(docEntity, doc) {
    return docEntity.getBasicProperties().reduce(
        (memo, basicProperty) => {
            var bp = {
                name: basicProperty.name,
                value: doc[basicProperty.name],
                propertyType: basicProperty.propertyType
            };

            memo.basicProperties.push(bp);
            return memo;
        },
        {
            type: doc.type,
            id: doc.id,
            basicProperties: []
        }
    );
}

function extractInfo(persistence, docEntity, recursiveCount, doc) {
    if (!doc) {
        return Promise.resolve(null);
    }

    return Promise.resolve()
        .then(() => {
            const objectWithBasicProperties = initResultObject(docEntity, doc);
            const resultObject = basicPropertiesToKeys(objectWithBasicProperties);

            if (!recursiveCount) {
                return resultObject;
            }

            return Promise.reduce(
                docEntity.getRelationships(),
                (memo, relationship) => {
                    return relationship.getDocuments(persistence, doc)
                        .then((targetDocs) => {
                            return Promise.map(
                                    targetDocs,
                                    (targetDoc) => {
                                        return extractInfo(persistence, relationship.getTargetEntity(), recursiveCount - 1, targetDoc);
                                    }
                                )
                                .then((infos) => {
                                    return _.extend(memo, {
                                        [relationship.name]: infos
                                    });
                                });
                        });
                },
                resultObject
            );
        });
}

module.exports = (persistence, instance, overviewRelationship) => {
    // Recursion level:
    //  1: Image
    //  2: Map
    //  3: Target
    const extractParagraphInfo = extractInfo.bind(null, persistence, overviewRelationship.getTargetEntity(), 3);

    return overviewRelationship.getDocuments(persistence, instance)
        .then((docs) => {
            return Promise.map(docs, extractParagraphInfo);
        });
};
