const _ = require('lodash');
// const debug = require('debug')('W2:models:entity');
const Promise = require('bluebird');
const RoutesInfo = require('@quoin/expressjs-routes-info');
const uuid = require('uuid/v4');
const warpjsUtils = require('@warp-works/warpjs-utils');

const Base = require('./base');
const BasicProperty = require('./basic-property');
const config = require('./../../../server/config');
const entityOverview = require('./entity-overview');
const Enumeration = require('./enumeration');
const Relationship = require('./relationship');
const updatePathInfo = require('./../update-path-info');
const utils = require('./../utils');
const WarpWorksError = require('./../error');
const views = require('./views');

function ensureInstanceEmbedded(instance) {
    if (!instance.embedded) {
        instance.embedded = [];
    }
}

class Entity extends Base {
    constructor(domain, id, name, desc, parentClass, isRootEntity, isRootInstance) {
        super("Entity", domain, id, name, desc);
        this.isRootEntity = isRootEntity;
        this.isRootInstance = isRootInstance;
        this.isAbstract = false;
        this.namePlural = name + "s";
        this.entityType = this.ENTITY_TYPES.Document;

        if (isRootEntity) {
            // Create relationship to rootInstance
            this.setRootEntityStatus(true);
        }

        // Inheritance
        this.parentClass = parentClass ? [parentClass] : null;

        // Child elements:
        this.basicProperties = [];
        this.enums = [];
        this.relationships = [];
        this.pageViews = [];
        this.tableViews = [];
    }

    get entityDisplayName() {
        const prefix = (this.isAbstract) ? '%' : (this.isRootInstance) ? '#' : '';
        return `${prefix}${this.name}`;
    }

    // eslint-disable-next-line camelcase
    getParent_Domain() {
        return this.parent;
    }

    setRootEntityStatus(declareAsRootEntity) {
        if (this.isRootInstance) {
            throw new WarpWorksError("Can not convert RootInstance to RootEntity!");
        } else if (!declareAsRootEntity) {
            throw new WarpWorksError("Currently not supported, sorry - TBD!");
        } else {
            if (this.isRootEntity) {
                return;
            } // Is already a root instance, ignore...
            var relName = this.namePlural.charAt(0).toUpperCase() + this.namePlural.slice(1);
            var rel = this.getDomain().getRootInstance().addNewRelationship(this, true, relName);
            rel.targetMax = '*';
            this.isRootEntity = true;
        }
    }

    createNewDefaultViews() {
        // TBD - Workaround: Remove existing views
        this.tableViews = [];
        this.pageViews = [];

        this.createNewDefaultTableView();
        this.createNewDefaultPageView();
        this.createNewDefaultPortalView();
    }

    createNewDefaultTableView() {
        // Create new default table view
        var newDefaultTableView = this.addNewTableView("DefaultTableView", "");
        newDefaultTableView.setAsDefault();
        var pos = 0;
        var properties = this.getBasicProperties();
        for (var i in properties) {
            var property = properties[i];
            var tableItem = newDefaultTableView.addNewTableItem(property.name, "Tooltip", property);
            tableItem.position = pos++;
        }
    }

    createNewDefaultPortalView() {
        var i;

        // Create new default page view
        var newDefaultPageView = this.addNewPageView("DefaultPortalView", "");

        // First Tab: properties, enums and associations
        var assocs = this.getAssociations();
        var properties = this.getBasicProperties();
        var enums = this.getEnums();
        var aggs = this.getAggregations();
        var basicCount = properties.length + enums.length + assocs.length + aggs.length;
        var createdAtLeastOne = false;
        if (basicCount > 0) {
            var pos = 0;
            var item = null;
            var panel = newDefaultPageView.addNewPanel("Basics", "Properties, Enums, Associations and Aggregations");
            panel.position = 0;
            for (i in properties) {
                var property = properties[i];
                item = panel.addNewBasicPropertyPanelItem(property.name, "Tooltip for " + property.name, property);
                item.position = pos++;
            }
            createdAtLeastOne = properties.length > 0;
            if (createdAtLeastOne && enums.length > 0) {
                item = panel.addNewSeparatorPanelItem();
                item.position = pos++;
            }
            for (i in enums) {
                var enumeration = enums[i];
                item = panel.addNewEnumPanelItem(enumeration.name, "Tooltip for " + enumeration.name, enumeration);
                item.position = pos++;
            }
            createdAtLeastOne = createdAtLeastOne || enums.length > 0;
            if (createdAtLeastOne && assocs.length > 2) {
                item = panel.addNewSeparatorPanelItem();
                item.position = pos++;
            }
            for (i in assocs) {
                var assoc = assocs[i];
                if (assoc.name !== "ReadAccess" && assoc.name !== "WriteAccess") {
                    item = panel.addNewRelationshipPanelItem(assoc.name, "Tooltip for " + assocs[i].name, assocs[i]);
                    item.style = "CSV";
                    item.position = pos++;
                }
            }
            createdAtLeastOne = createdAtLeastOne || assocs.length > 0;
            if (createdAtLeastOne && aggs.length > 1) {
                item = panel.addNewSeparatorPanelItem();
                item.position = pos++;
            }
            for (i in aggs) {
                var agg = aggs[i];
                if (agg.name !== "Overview") {
                    item = panel.addNewRelationshipPanelItem(agg.name, "Tooltip", aggs[i]);
                    item.style = "CSV";
                    item.position = pos++;
                }
            }
        }
    }

    isDocument() {
        return this.entityType === this.ENTITY_TYPES.Document;
    };

    getOverview(persistence, instance) {
        return Promise.resolve()
            .then(() => this.getRelationships())
            .then((relationships) => relationships.filter((relationship) => relationship.name === 'Overview'))
            .then((relationships) => {
                if (relationships && relationships.length) {
                    return entityOverview(
                        persistence,
                        instance,
                        relationships[relationships.length - 1], // Use the last because of inheritence.
                        3 // FIXME: This is hard-coded.
                    );
                }
                return null;
            });
    }

    /**
     *  Gets the overviews.
     */
    getOverviews(persistence, instance) {
        return Promise.resolve()
            .then(() => this.getRelationshipByName('Overview'))
            .then((relationship) => relationship ? relationship.getDocuments(persistence, instance) : [])
            .then((overviews) => overviews.map((overview) => _.pick(overview, ['Heading', 'Content'])))
        ;
    }

    /**
     *  Gets the first image of the first overview.
     */
    getSnippetImageUrl(persistence, instance) {
        return Promise.resolve()
            .then(() => this.getRelationshipByName('Overview'))
            .then((relationship) => {
                if (relationship) {
                    const targetEntity = relationship.getTargetEntity();

                    return Promise.resolve()
                        .then(() => relationship.getDocuments(persistence, instance))
                        .then((overviews) => overviews.shift())
                        .then((overview) => {
                            if (overview) {
                                // Try get the image.
                                return Promise.resolve()
                                    .then(() => targetEntity.getRelationshipByName('Images'))
                                    .then((relationship) => relationship ? relationship.getDocuments(persistence, overview) : [])
                                    .then((images) => images.shift())
                                    .then((image) => image ? image.ImageURL : null)
                                ;
                            }
                        })
                    ;
                }
            })
        ;
    }

    createNewDefaultPageView() {
        var i;
        var item;
        var property;

        // Create new default page view
        var newDefaultPageView = this.addNewPageView("DefaultPageView", "");
        newDefaultPageView.setAsDefault();
        newDefaultPageView.label = this.name;

        // First Tab: properties, enums and associations
        var assocs = this.getAssociations();
        var properties = this.getBasicProperties();
        var enums = this.getEnums();
        var basicCount = properties.length + enums.length + assocs.length;
        var createdAtLeastOne = false;
        if (basicCount > 0) {
            var pos = 0;
            item = null;
            var propertyPanel = newDefaultPageView.addNewPanel("Basics", "Properties, Enums and Associations");
            propertyPanel.position = 0;
            for (i in properties) {
                property = properties[i];
                item = propertyPanel.addNewBasicPropertyPanelItem(property.name, "Tooltip for " + property.name, property);
                item.position = pos++;
            }
            createdAtLeastOne = properties.length > 0;
            if (createdAtLeastOne && enums.length) {
                item = propertyPanel.addNewSeparatorPanelItem();
                item.position = pos++;
            }
            createdAtLeastOne = createdAtLeastOne || enums.length > 0;
            for (i in enums) {
                var enumeration = enums[i];
                item = propertyPanel.addNewEnumPanelItem(enumeration.name, "Tooltip for " + enumeration.name, enumeration);
                item.position = pos++;
            }
            if (createdAtLeastOne && assocs.length) {
                item = propertyPanel.addNewSeparatorPanelItem();
                item.position = pos++;
                createdAtLeastOne = true;
            }
            for (i in assocs) {
                item = propertyPanel.addNewRelationshipPanelItem(assocs[i].name, "Tooltip for " + assocs[i].name, assocs[i]);
                item.style = 'CSV';
                item.position = pos++;
            }
        }

        // Next: one tab per relationship
        var aggs = this.getAggregations();
        pos = basicCount > 0 ? 1 : 0;
        for (i in aggs) {
            var relationshipPanel = newDefaultPageView.addNewPanel(aggs[i].name, "Tooltip");
            relationshipPanel.position = pos++;
            item = relationshipPanel.addNewRelationshipPanelItem(aggs[i].name, "Tooltip", aggs[i]);
            item.style = aggs[i].targetEntity[0].entityType === "Embedded" ? "Carousel" : "Table";
            item.position = 0;
        }
    }

    canBeInstantiated() {
        if (this.isRootEntity || this.isRootInstance) {
            return true;
        }
        var parentAggs = this.getAllParentAggregations();
        if (parentAggs && parentAggs.length) {
            return true;
        }
        if (this.hasParentClass()) {
            return this.getParentClass().canBeInstantiated();
        }
        return false;
    }

    newInstance(parentRelationship) {
        const instance = {
            type: this.name // FIXME: Use immutable value.
        };

        if (!this.isDocument()) {
            instance._id = uuid();
        }

        this.getBasicProperties().forEach((prop) => {
            instance[prop.name] = prop.newInstance();
        });

        this.getEnums().forEach((prop) => {
            instance[prop.name] = prop.newInstance();
        });

        return instance;
    }

    createTestDocument(createEmbeddedEntities, path) {
        var testDoc = {};
        testDoc.type = this.name;
        testDoc.path = path;

        // Basic Properties
        var properties = this.getBasicProperties();
        if (properties && properties.length) {
            properties.forEach(function(property) {
                testDoc[property.name] = property.getTestData();
            });
        }

        // Enums
        var enums = this.getEnums();
        if (enums && enums.length) {
            enums.forEach(function(anEnum) {
                testDoc[anEnum.name] = anEnum.getTestData();
            });
        }

        // Embedded Documents
        if (createEmbeddedEntities) {
            var ObjectID = require('mongodb').ObjectID;
            testDoc._id = new ObjectID();
            testDoc.embedded = [];
            var aggs = this.getAggregations();
            if (aggs) {
                // Create dedicated object for each target relationship
                aggs.forEach(function(reln) {
                    // Only add embedded entities:
                    if (reln.getTargetEntity().isDocument()) {
                        return;
                    }

                    // Determine average number of children
                    var avg = reln.targetAverage;
                    if (isNaN(avg)) {
                        console.log("WARNING: Incomplete Quantity Model - Average for relationship '" + reln.name + "' not defined! Assuming AVG=1");
                        avg = 1;
                    }

                    var relnContainer = {};
                    relnContainer.parentRelnID = reln.id;
                    relnContainer.parentRelnName = reln.name;
                    relnContainer.entities = [];
                    for (var i = 0; i < avg; i++) {
                        var nextPath = path + reln.name + ':' + (i + 1) + "/";
                        var embeddedChild = reln.getTargetEntity().createTestDocument(true, nextPath);
                        relnContainer.entities.push(embeddedChild);
                    }
                    testDoc.embedded.push(relnContainer);
                });
            }
        }

        return testDoc;
    }

    hasParentClass() {
        return this.parentClass && this.parentClass.length && this.parentClass[0] != null;
    }

    getParentClass() {
        return this.parentClass[0];
    }

    getBaseClass() {
        // BaseClass = Topmost, non-abstract class in the inheritance hierarchy
        var res = this;
        while (res.hasParentClass() && !res.getParentClass().isAbstract) {
            res = res.getParentClass();
        }
        if (res.isAbstract) {
            return null;
        }
        return res;
    }

    setParentClass(pc) {
        this.parentClass = [pc];
    }

    getBasicProperties(ignoreInheritedProperties) {
        if (!ignoreInheritedProperties && this.hasParentClass()) {
            return this.getParentClass().getBasicProperties().concat(this.basicProperties);
        }
        return this.basicProperties;
    }

    getEnums(ignoreInheritedEnums) {
        if (!ignoreInheritedEnums && this.hasParentClass()) {
            return this.getParentClass().getEnums().concat(this.enums);
        }
        return this.enums;
    }

    getPageView(viewName) {
        // Get the last items instead of the first one with `.find()`
        const foundPageViews = this.getPageViews(/* true */).filter((pageView) => pageView.name === viewName);
        if (foundPageViews.length) {
            return foundPageViews[foundPageViews.length - 1];
        }
        return this.getDefaultPageView();
    }

    getPageViews(ignoreInheritedPageViews) {
        if (!ignoreInheritedPageViews && this.hasParentClass()) {
            return this.getParentClass().getPageViews().concat(this.pageViews);
        }
        return this.pageViews;
    }

    getDefaultPageView() {
        for (var idx = 0; idx < this.pageViews.length; idx++) {
            if (this.pageViews[idx].isDefault) {
                return this.pageViews[idx];
            }
        }
        if (this.hasParentClass()) {
            return this.getParentClass().getDefaulPageViews();
        } else {
            return null;
        }
    }

    getTableViews(ignoreInheritedTableViews) {
        if (!ignoreInheritedTableViews && this.hasParentClass()) {
            return this.getParentClass().getTableViews().concat(this.tableViews);
        }
        return this.tableViews;
    }

    getDefaultTableView() {
        for (var idx = 0; idx < this.tableViews.length; idx++) {
            if (this.tableViews[idx].isDefault) {
                return this.tableViews[idx];
            }
        }
        if (this.hasParentClass()) {
            return this.getParentClass().getDefaulTableViews();
        } else {
            return null;
        }
    }

    getRelationships(ignoreInheritedRelationships) {
        if (!ignoreInheritedRelationships && this.hasParentClass()) {
            return this.getParentClass().getRelationships().concat(this.relationships);
        }
        return this.relationships;
    }

    getRelationshipById(id) {
        const relationships = this.getRelationships().filter((rel) => rel.id === id);
        return relationships.pop(); // Get latest one in case of inheritance.
    }

    getRelationshipByName(relationshipName) {
        const relationships = this.getRelationships().filter((rel) => rel.name === relationshipName);
        return relationships.pop(); // Get latest one in case of inheritance.
    }

    getAggregations(ignoreInheritedAggregations) {
        const a = this.relationships
            .filter((relationship) => relationship.isAggregation)
            .map((relationship) => relationship);

        if (!ignoreInheritedAggregations && this.hasParentClass()) {
            return this.getParentClass().getAggregations().concat(a);
        }
        return a;
    }

    getAssociations(ignoreIngeritedAssociations) {
        var a = [];
        for (var i in this.relationships) {
            if (!this.relationships[i].isAggregation) {
                a.push(this.relationships[i]);
            }
        }
        if (!ignoreIngeritedAssociations && this.hasParentClass()) {
            return a.concat(this.getParentClass().getAssociations());
        }
        return a;
    }

    // TBD: What about multiple levels of inheritance...? (eg C is B, B is A?)
    getAllDerivedEntities() {
        // Return all entities that inherit from this entity
        var domain = this.parent;
        var derivedEntities = [];
        for (var i in domain.entities) {
            var entity = domain.entities[i];
            if (entity.hasParentClass()) {
                var parent = entity.getParentClass();
                if (this.compareToMyID(parent.id)) {
                    derivedEntities.push(entity);
                }
            }
        }
        return derivedEntities;
    }

    // TBD - support inheritance!
    getAllParentAggregations() {
        // Return all aggregations which link to this entity (returns the aggregation, not the parent entity!)
        var domain = this.parent;
        var parentAggs = [];
        var entities = domain.getEntities();
        for (var i in entities) {
            var entity = entities[i];
            var aggRels = entity.getAggregations();
            for (var k in aggRels) {
                var rel = aggRels[k];
                if (rel.hasTargetEntity() && this.compareToMyID(rel.getTargetEntity().id)) {
                    parentAggs.push(rel);
                }
            }
        }
        return parentAggs;
    }

    processLocalTemplateFunctions(template) {
        var children = [
            // Without parent elements...
            ["BasicProperty", this.getBasicProperties(true)],
            ["Enumeration", this.getEnums(true)],
            ["Relationship", this.getRelationships(true)],
            ["Aggregation", this.getAggregations(true)],
            ["Association", this.getAssociations(true)],
            ["PageView", this.getPageViews(true)],
            ["TableView", this.getTableViews(true)],
            // ...and the same *with* parent elements:
            ["BasicProperty!", this.getBasicProperties(false)],
            ["Enumeration!", this.getEnums(false)],
            ["Relationship!", this.getRelationships(false)],
            ["Aggregation!", this.getAggregations(false)],
            ["Association!", this.getAssociations(false)],
            ["PageView!", this.getPageViews(false)],
            ["TableView!", this.getTableViews(false)]
            // Notice that the !-operator can be combined with the ?-operator
            // Example: {{Enumeration!?}}...{{Enumeration!}}...{{/Enumeration!}}...{{/Enumeration!?}}
        ];

        template = this.processTemplateWithChildElements(template, children);
        return super.processLocalTemplateFunctions(template);
    }

    addNewBasicProperty(name, desc, propertyType) {
        var id = this.getDomain().createNewID();
        var newBasicProperty = new BasicProperty(this, id, name, desc, propertyType);
        this.basicProperties.push(newBasicProperty);
        return newBasicProperty;
    }

    addNewEnum(name, desc) {
        var id = this.getDomain().createNewID();
        var newEnum = new Enumeration(this, id, name, desc);
        this.enums.push(newEnum);
        return newEnum;
    }

    addNewRelationship(target, isAggregation, name) {
        var id = this.getDomain().createNewID();
        if (!name) {
            name = target.namePlural;
        }
        var newRelationship = new Relationship(this, target, id, isAggregation, name);
        this.relationships.push(newRelationship);
        return newRelationship;
    }

    addNewPageView(name, desc) {
        var id = this.getDomain().createNewID();
        var newPageView = new views.PageView(this, id, name, desc);

        this.pageViews.push(newPageView);
        return newPageView;
    }

    addNewTableView(name, desc) {
        var id = this.getDomain().createNewID();
        var newTableView = new views.TableView(this, id, name, desc);
        this.tableViews.push(newTableView);
        return newTableView;
    }

    getAllElements(includeSelf) {
        var i;
        var r = [];
        if (includeSelf) {
            r = r.concat(this);
        }
        // Add children with no own children directly:
        r = r.concat(this.relationships);
        r = r.concat(this.basicProperties);
        // Children with children:
        for (i in this.enums) {
            r = r.concat(this.enums[i].getAllElements(true));
        }
        for (i in this.pageViews) {
            r = r.concat(this.pageViews[i].getAllElements(true));
        }
        for (i in this.tableViews) {
            r = r.concat(this.tableViews[i].getAllElements(true));
        }
        return r;
    }

    getChildEntities(recursive, flatten) {
        const domain = this.getDomain();
        const childEntities = domain.getEntities()
            .filter((entity) => entity.getParentClass() && entity.getParentClass().id === this.id);
        if (recursive) {
            if (flatten) {
                return childEntities.reduce((memo, entity) => memo.concat(entity.getChildEntities(recursive, flatten)), [].concat(childEntities));
            }
            childEntities.forEach((entity) => {
                entity.children = entity.getChildEntities(recursive, flatten);
            });
            return childEntities;
        }
        return childEntities;
    }

    createDocument(persistence, instance) {
        instance.lastUpdated = (new Date()).toISOString();
        return persistence.save(this.getBaseClass().name, instance);
    }

    removeDocument(persistence, instance) {
        return persistence.remove(this.getBaseClass().name, instance);
    }

    updateDocument(persistence, instance) {
        instance.lastUpdated = (new Date()).toISOString();
        return persistence.update(this.getBaseClass().name, instance);
    }
	updateSetDocument(persistence, instance,path) {
        instance.lastUpdated = (new Date()).toISOString();
        return persistence.updateSet(this.getBaseClass().name, instance,path);
    }

    toString(t) {
        var comma;
        var i;
        var isFirst;
        var j;
        var result = "";
        if (!t) {
            return result;
        }

        var name = (this.isRootInstance ? '#' : '') + this.name;

        switch (t) {
            case Entity.TO_STRING_TYPES.PROPERTIES:
                result += this.hasParentClass() ? "(" + this.getParentClass().name + ")" : "";
                if (this.enums.length || this.basicProperties.length) {
                    result += ": ";
                }
                for (i in this.basicProperties) {
                    result += (i > 0 ? ", " : "") + this.basicProperties[i].toString();
                }
                if (this.enums.length) {
                    result += ", ";
                }
                for (j in this.enums) {
                    result += (j > 0 ? ", " : "") + this.enums[j].toString();
                }
                return name + result;
            case Entity.TO_STRING_TYPES.AGGREGATIONS:
                isFirst = true;
                for (i in this.relationships) {
                    if (this.relationships[i].isAggregation) {
                        comma = isFirst ? "" : ", ";
                        result += comma + this.relationships[i].toString();
                        isFirst = false;
                    }
                }
                return result.length ? name + ": { " + result + " }" : "";
            case Entity.TO_STRING_TYPES.ASSOCIATIONS:
                isFirst = true;
                for (i in this.relationships) {
                    if (!this.relationships[i].isAggregation) {
                        comma = isFirst ? "" : ", ";
                        result += comma + this.relationships[i].toString();
                        isFirst = false;
                    }
                }
                return result.length ? name + ": " + result : "";
        }
        throw new WarpWorksError("Invalid option: " + t);
    }

    baseJSON() {
        return {
            name: this.name,
            desc: this.desc,
            type: this.type,
            id: this.idToJSON(),
            isRootEntity: this.isRootEntity,
            isRootInstance: this.isRootInstance,
            isAbstract: this.isAbstract,
            entityType: this.entityType,
            namePlural: this.namePlural
        };
    }

    toJSON() {
        return _.extend({}, this.baseJSON(), {
            parentClass: this.hasParentClass() ? [this.getParentClass().id] : [],
            basicProperties: utils.mapJSON(this.basicProperties),
            enums: utils.mapJSON(this.enums),
            relationships: utils.mapJSON(this.relationships),
            pageViews: utils.mapJSON(this.pageViews),
            tableViews: utils.mapJSON(this.tableViews)
        });
    }

    toResource(instance, lastDocumentLevelHref) {
        const domain = this.getDomain().name;
        let resource;

        if (instance) {
            lastDocumentLevelHref = this.isDocument()
                ? RoutesInfo.expand('W2:content:instance', { domain, type: instance.type, id: instance.id })
                : lastDocumentLevelHref;

            resource = warpjsUtils.createResource(
                RoutesInfo.expand('W2:content:instance', {
                    domain,
                    type: instance.type,
                    id: instance.id
                }),
                {
                    domain,
                    type: instance.type,
                    id: instance.id,
                    relnDesc: instance.relnDesc,
                    displayName: this.getDisplayName(instance)
                }
            );

            this.getBasicProperties().forEach((basicProperty) => {
                resource[basicProperty.name] = basicProperty.getValue(instance);
            });
        } else {
            const selfHref = RoutesInfo.expand('W2:content:entity', {
                domain,
                type: this.name
            });
            resource = warpjsUtils.createResource(selfHref, this.baseJSON());

            resource.link('instances', RoutesInfo.expand('W2:content:instances', {
                domain,
                type: this.name
            }));
        }
        return resource;
    }

    toFormResource(persistence, instance, docLevel, docs, relativeToDocument) {
        const domain = this.getDomain().name;

        if (this.isDocument()) {
            const href = RoutesInfo.expand('W2:content:entities', { domain, type: this.name });
            const resource = warpjsUtils.createResource(href, this.baseJSON());
            const basicProperties = this.getBasicProperties()
                .filter((basicProperty) => !basicProperty.isPassword())
                .map((basicProperty) => basicProperty.name);

            const existingDocs = docs.filter((doc) => doc.id && doc.type);

            const data = existingDocs.map((doc) => [
                RoutesInfo.expand('W2:content:instance', {
                    domain,
                    type: doc.type,
                    id: doc.id
                })
            ].concat(basicProperties.map((basicProperty) => doc[basicProperty])));

            resource.tableView = {
                basicProperties,
                data
            };

            resource.data = data;

            const entities = existingDocs.map((doc) => {
                const resource = this.toResource(doc, relativeToDocument.href);
                resource.docLevel = docLevel.concat(`Entity:${doc.id}`).join('.');
                return resource;
            });
            resource.embed('entities', entities);

            return Promise.resolve(resource);
        } else {
            const resource = warpjsUtils.createResource(relativeToDocument.href, this.baseJSON());
            const pv = this.getPageView(config.views.content);

            return Promise.map(docs,
                (doc, indexPosition) => Promise.resolve()
                    .then(() => pv.toFormResource(persistence, doc, docLevel.concat(`Entity:${doc._id}`), relativeToDocument))
                    .then((data) => _.extend({}, data, { indexPosition }))
            )
                .then((data) => {
                    resource.data = data;
                })
                .then(() => resource);
        }
    }

    patch(updatePath, updatePathLevel, instance, updateValue, patchAction) {
        // debug(`entity=${this.name}; updatePath=${updatePath}; updatePathLevel=${updatePathLevel}; instace=`, instance);
        const currentPatch = updatePathInfo(updatePath, updatePathLevel);

        if (currentPatch[0] === 'Basic') {
            // Basic, no need for the wrapper.
            return Promise.resolve()
                .then(() => this.getBasicProperties().find((bp) => bp.name === currentPatch[1]))
                .then((model) => model.patch(updatePath, updatePathLevel + 1, instance, updateValue))
            ;
        } else if (currentPatch[0] === 'Relationship') {
            return Promise.resolve()
                .then(() => this.getRelationships())
                .then((relationships) => relationships.find((relationship) => relationship.name === currentPatch[1]))
                .then((relationship) => relationship.patch(updatePath, updatePathLevel + 1, instance, updateValue, patchAction))
            ;
        } else if (currentPatch[0] === 'Enum') {
            return Promise.resolve()
                .then(() => this.getEnums().find((en) => en.name === currentPatch[1]))
                .then((model) => model.patch(updatePath, updatePathLevel + 1, instance, updateValue))
            ;
        } else {
            throw new Error(`TODO: currentPatch=${currentPatch.join(':')}`);
        }
    }

    addData(updatePath, updatePathLevel, instance, updateValue) {
        const currentPatch = updatePathInfo(updatePath, updatePathLevel);

        if (currentPatch[0] === 'Relationship') {
            return Promise.resolve()
                .then(() => this.getRelationshipByName(currentPatch[1]))
                .then((relationship) => relationship.addData(instance, updateValue))
            ;
        } else {
            throw new Error(`TODO: currentPatch=${currentPatch.join(':')}`);
        }
    }

    createSiblingForInstance(instance) {
        if (instance.isRootInstance) {
            return Promise.reject(new WarpWorksError("Cannot create sibling for rootInstance."));
        }
        return _.pick(instance, [
            'type',
            'parentID',
            'parentRelnID',
            'parentRelnName',
            'parentBaseClassID',
            'parentBaseClassName'
        ]);
    }

    createChildForInstance(instance, relationship) {
        return {
            type: relationship.getTargetEntity().name,
            parentID: instance.id,
            parentRelnID: relationship.id,
            parentRelnName: relationship.name,
            parentBaseClassID: this.id,
            parentBaseClassName: this.name
        };
    }
	getRelationshipByChildName(name){
		
		var relationships = this.getRelationships();
		for (var rel in relationships){
			if (relationships[rel].targetEntity[0].name === name ){				
				return relationships[rel]
			}
		}
			// if u dont find anything return parentClass
		if (typeof(this.getDomain().getEntityByName(name).parentClass[0]) != "undefined"){
			return this.getRelationshipByChildName(this.getDomain().getEntityByName(name).parentClass[0].name);
			
		}
		

		return null;		
		
	}

    addEmbedded(instance, docLevel, level) {
        const currentPatch = updatePathInfo(docLevel, level);
        const relationshipEntity = this.getRelationshipByName(currentPatch[1]);

        ensureInstanceEmbedded(instance);
        return relationshipEntity.addEmbedded(instance.embedded, docLevel, level);
    }

    removeEmbedded(instance, docLevel, level) {
        const currentPatch = updatePathInfo(docLevel, level);
        const relationshipEntity = this.getRelationshipByName(currentPatch[1]);

        ensureInstanceEmbedded(instance);
        instance.embedded = relationshipEntity.removeEmbedded(instance.embedded, docLevel, level);

        return instance;
    }

    getParentEntity(instance) {
        return Promise.resolve()
            .then(() => this.getDomain())
            .then((domain) => domain.getEntityById(instance.parentBaseClassID))
        ;
    }

    getParentInstance(persistence, instance) {
        return Promise.resolve()
            .then(() => this.getParentEntity(instance))
            .then((parentEntity) => parentEntity.getDocuments(persistence, {_id: instance.parentID}, true))
        ;
    }
	getChildInstances(persistence,id) {
        return Promise.resolve()
            .then(() => this.getDocuments(persistence, {parentID: id}, true))
        ;
    }
	
}

Entity.TO_STRING_TYPES = {
    PROPERTIES: 'properties',
    AGGREGATIONS: 'aggregations',
    ASSOCIATIONS: 'associations'
};

Entity.prototype.ENTITY_TYPES = {
    Document: "Document",
    Embedded: "Embedded"
};

module.exports = Entity;
