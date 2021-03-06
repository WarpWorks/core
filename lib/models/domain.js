const _ = require('lodash');
// const debug = require('debug')('W2:models:domain');
const fs = require('fs');
const Promise = require('bluebird');

const Base = require('./base');
const Entity = require('./entity');
const WarpWorksError = require('./../error');
const utils = require('./../utils');

class DomainError extends WarpWorksError {
}

// TODO: Fix this hard-coded value.
function isRolesRelationship(relationship) {
    return relationship.name === 'Roles';
}

class Domain extends Base {
    constructor(warpworks, name, desc, recreate) {
        // Special case - the parent of domain is warpworks, which is not of type "Base"
        super("Domain", warpworks, 1, name, desc);
        this.id_counter = 1;
        this.entities = [];
        this.definitionOfMany = 100;

        // Create rootEntity entity:
        if (!recreate) {
            this.addNewEntity(this.name, "Root for domain " + this.name, null, false, true);
        }
    }

    save() {
        var fn = this.getWarpWorks().getDir("domains", `${this.name}.jsn`);
        fs.writeFileSync(fn, JSON.stringify(this, null, 2));
        this.getWarpWorks().expireDomainCache(this.name);
    }

    createNewID() {
        if (this.id_counter < 2) {
            var max = 1;
            var all = this.getAllElements();
            for (var i in all) {
                if (all[i].id > max) {
                    max = all[i].id;
                }
            }
            this.id_counter = max + 1;
        }
        return this.id_counter++;
    }

    compareIDs(id1, id2) {
        return id1.toString() === id2.toString();
    }

    validateModel() {
        let i;
        let vRes = "";
        let wCount = 0;

        if (this.name === "New_Domain") {
            wCount++;
            vRes += "<br>[" + wCount + "]: <strong>" + this.name + "</strong> is not a unique name - please rename your Domain!";
        }

        // All Relationships need targets
        for (i in this.entities) {
            for (let j in this.entities[i].relationships) {
                if (!this.entities[i].relationships[j].hasTargetEntity()) {
                    wCount++;
                    vRes += "<br>[" + wCount + "]: <strong>" + this.entities[i].name + "::" + this.entities[i].relationships[j].name + "</strong> does not have a target!";
                }
            }
        }

        // All entities should either be abstract, root entity or aggregated by another entity (directly or through inheritance):
        for (i in this.entities) {
            if (!this.entities[i].isAbstract && !this.entities[i].canBeInstantiated()) {
                wCount++;
                vRes += "<br>[" + wCount + "]: <strong>" + this.entities[i].name + "</strong> can not be instantiated (solution: make it a RootEntity or child of another entity)";
            }
        }

        // No Entity of type "Embedded" should aggregate an Entity of type "Document"
        for (i in this.entities) {
            for (let j in this.entities[i].relationships) {
                if (!this.entities[i].isDocument() &&
                    this.entities[i].relationships[j].isAggregation &&
                    this.entities[i].relationships[j].hasTargetEntity() &&
                    this.entities[i].relationships[j].getTargetEntity().isDocument()) {
                    wCount++;
                    vRes += "<br>[" + wCount + "]: <strong>" + this.entities[i].name + "::" + this.entities[i].relationships[j].name + "</strong>: Embedded entity '" + this.entities[i].name + "' can not aggregate document-type '" + this.entities[i].relationships[j].getTargetEntity().name + "'!";
                }
            }
        }

        if (wCount === 0) {
            return null;
        }
        return wCount === 1 ? "<strong>1 Warning:</strong>" + vRes : "<strong>" + wCount + " Warnings:</strong>" + vRes;
    }

    getEntityByName(name) {
        const entities = this.getEntities().filter((entity) => entity.name === name);
        if (entities.length === 1) {
            return entities[0];
        }

        throw new DomainError(`Cannot find entity with name='${name}'.`);
    }
	
	getEntityByPluralName(pluralName) {
        const entities = this.getEntities().filter((entity) => entity.namePlural === pluralName);
        if (entities.length === 1) {
            return entities[0];
        }

        throw new DomainError(`Cannot find entity with name='${name}'.`);
    }

    getParentEntityByRelationship(parentRelnID) {
        return this.getEntities(/*true*/).find((entity) => {
            return entity.getRelationships(/*true*/).find((relationship) => {
                return relationship.id === parentRelnID;
            });
        });
    }

    /**
     *  Retrieve the parent's entity based on the information of
     *  `parentBaseClassName` from the instance data.
     */
    getParentEntityByParentBaseClassName(instance) {
        if (instance.parentBaseClassName) {
            return this.getEntityByName(instance.parentBaseClassName);
        }
        return null;
    }

    getEntities(sortByInheritance) {
        if (!sortByInheritance) {
            return this.entities;
        }
        for (var i in this.entities) {
            var entity = this.entities[i];
            entity.longName = entity.name;
            var tmpEntity = entity;
            while (tmpEntity.hasParentClass()) {
                tmpEntity = tmpEntity.getParentClass();
                entity.longName = tmpEntity.name + ":" + entity.longName;
            }
        }
        return this.entities.sort(function(a, b) {
            if (a.longName < b.longName) {
                return -1;
            }
            if (a.longName > b.longName) {
                return 1;
            }
            return 0;
        });
    }

    getRootEntities() {
        var allEntities = this.entities;
        var rootEntities = [];
        for (var i in allEntities) {
            if (allEntities[i].isRootEntity) {
                rootEntities.push(allEntities[i]);
            }
        }
        return allEntities;
    }

    getRootInstance() {
        var allEntities = this.entities;
        for (var i in allEntities) {
            if (allEntities[i].isRootInstance) {
                return allEntities[i];
            }
        }
        throw new Error("Domain without root instance!");
    }

    addEntity(newEntity) {
        return this.entities.push(newEntity);
    }

    addNewEntity(name, desc, parentClass, isRootEntity, isRootInstance) {
        var id = this.getDomain().createNewID();
        var newEntity = new Entity(this, id, name, desc, parentClass, isRootEntity, isRootInstance);

        this.addEntity(newEntity);
        return newEntity;
    }

    createNewDefaultViews() {
        this.getEntities().forEach(function(elem) {
            elem.createNewDefaultViews();
        });
    }

    getAllElements(includeSelf) {
        // Returns an array containing all child elements; optional: also include self
        var r = [];
        if (includeSelf) {
            r = r.concat(this);
        }
        for (var i in this.getEntities()) {
            r = r.concat(this.getEntities()[i].getAllElements(true));
        }
        return r;
    }

    /**
     *  Gets the authenticated user or reject.
     *
     *  @param {object} persistence - Persistence layer.
     *  @param {string} username - Username to authenticate.
     *  @param {string} password - Password to authenticate with.
     *  @returns {Promise} - Resolve with user info if authentication succeed.
     *      Reject if fails.
     */
    authenticateUser(persistence, UserName, Password) {
        // TODO: Not hard-code entity names.
        return persistence.aggregate('Account', 'parentID', 'User', '_id', 'userInfo', { UserName, Password })
            .then((users) => {
                if (users && users.length === 1) {
                    return users[0].userInfo[0];
                }
                throw new DomainError("Authentication failed.");
            })
            .then((user) => {
                const userEntity = this.getEntityByName('User');
                const relationships = userEntity.getRelationships().filter(isRolesRelationship);

                return Promise.reduce(
                        relationships,
                        (memo, relationship) => relationship.getDocuments(persistence, user)
                            .then((roles) => memo.concat(roles)),
                        []
                    )
                    .then((roles) => {
                        return _.extend({}, _.pick(user, ['_id', 'type', 'Name']), {
                            UserName,
                            Roles: roles.map((role) => ({
                                type: role.type,
                                Name: role.Name,
                                Description: role.Description,
                                id: role.id,
                                label: role.Name
                            }))
                        });
                    });
            });
    }

    createTestDataForEntity(entityDef, relationship, parentInstanceID, parentBaseClass, path) {
        // TBD: Change algorithm to  create as many entities as possible with one DB insert

        if (entityDef.isAbstract) {
            return;
        } // Don't create test instances for abstract entity types!

        // Create test document, including embedded entities
        path = parentInstanceID ? path : "/";
        var testData = entityDef.createTestDocument(true, path);

        if (parentInstanceID) {
            testData.parentID = parentInstanceID;
            testData.parentRelnID = relationship.id;
            testData.parentRelnName = relationship.name;
            testData.parentBaseClassID = parentBaseClass.id;
            testData.parentBaseClassName = parentBaseClass.name;
        } else {
            testData.isRootInstance = true;
            testData.parentID = null;
            testData.parentRelID = null;
            testData.parentBaseClassID = null;
            testData.parentBaseClassName = null;
        }
        // TBD: TEST - var ObjectID = require("mongodb").ObjectID;
        // testData._id = new ObjectID().toString();

        var domain = this;
        this.getWarpWorks().useDB(domain.name, function(db) {
            var collection = db.collection(entityDef.getBaseClass().name);
            collection.insertOne(testData, function(mongoErr, mongoRes) {
                if (mongoErr) {
                    console.log("Error creating test data: " + mongoErr);
                } else {
                    var aggs = entityDef.getAggregations();
                    if (aggs) {
                        aggs.forEach(function(rel) {
                            if (!rel.getTargetEntity().isDocument()) {
                                return;
                            }
                            var avg = rel.targetAverage;
                            if (isNaN(avg)) {
                                console.log("WARNING: Incomplete Quantity Model - Average for relationship '" + rel.name + "' not defined! Assuming AVG=1");
                                avg = 1;
                            }
                            for (var i = 0; i < avg; i++) {
                                var nextPath = path + rel.name + ':' + (i + 1) + '/';
                                domain.createTestDataForEntity(rel.getTargetEntity(), rel, mongoRes.ops[0]._id, entityDef.getBaseClass(), nextPath);
                            }
                        });
                    }
                }
            });
        });
    }

    processLocalTemplateFunctions(template) {
        var children = [["Entity", this.getEntities(true)]];
        template = this.processTemplateWithChildElements(template, children);
        return super.processLocalTemplateFunctions(template);
    }

    toJSON() {
        return {
            name: this.name,
            desc: this.desc,
            type: this.type,
            id: this.idToJSON(),
            definitionOfMany: this.definitionOfMany,
            entities: utils.mapJSON(this.getEntities())
        };
    }

    toString() {
        var e;
        var es;
        var i;
        var s = "//\n// Domain '" + this.name + "'\n//\n";

        s += "\n// Basic Entity Definitions:\n";
        for (i in this.getEntities()) {
            e = this.getEntities()[i];
            s += e.toString("properties") + "\n";
        }

        s += "\n// Aggregation Hierarchy:\n";
        for (i in this.getEntities()) {
            e = this.getEntities()[i];
            es = e.toString("aggregations");
            if (es.length > 0) {
                s += es + "\n";
            }
        }

        s += "\n// Associations:\n";
        for (i in this.getEntities()) {
            e = this.getEntities()[i];
            es = e.toString("associations");
            if (es.length > 0) {
                s += es + "\n";
            }
        }

        return s;
    }

    getFileName(folder) {
        var f = folder ? folder + "\\" : "";
        var fn = '.\\generated\\' + f + this.name + '.html';
        return fn;
    }
}

module.exports = Domain;
