const _ = require('lodash');
const Promise = require('bluebird');

function basicPropertiesToKeys(obj) {
    let basicProperties = _.reduce(
        obj.basicProperties,
        (memo, value, key) => {
            return _.extend(memo, {
                [value.name]: value.value
            });
        },
        {}
    );
    return Object.assign(obj, basicProperties);
}

function initResultObject(docEntity, doc) {
    return {
        type: doc.type,
        id: doc.id,
        basicProperties: docEntity.getBasicProperties().map((basicProperty) => {
            return {
                name: basicProperty.name,
                value: doc[basicProperty.name],
                propertyType: basicProperty.propertyType
            };
        })
    };
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

module.exports = (persistence, instance, overviewRelationship, recursionLevel) => {
    // Recursion level:
    //  1: Image
    //  2: Map
    //  3: Target
    const extractParagraphInfo = extractInfo.bind(null, persistence, overviewRelationship.getTargetEntity(), recursionLevel);

    return overviewRelationship.getDocuments(persistence, instance)
        .then((docs) => {
            return Promise.map(docs, extractParagraphInfo);
        });
};
