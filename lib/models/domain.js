// const debug = require('debug')('W2:models:domain');
const fs = require('fs');

const Base = require('./base');
const Entity = require('./entity');
const WarpWorksError = require('./../error');
const utils = require('./../utils');

class DomainError extends WarpWorksError {
}

class Domain extends Base {
    constructor(warpworks, name, desc, recreate) {
        // Special case - the parent of domain is warpworks, which is not of type "Base"
        // FIXME: This `1` is a hard-coded value.
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

        throw new DomainError(`Cannot find entity with Pluralname='${pluralName}'.`);
    }

    getParentEntityByRelationship(parentRelnID) {
        return this.getEntities(/* true */).find((entity) => {
            return entity.getRelationships(/* true */).find((relationship) => {
                return relationship.id === parentRelnID;
            });
        });
    }
	getParentEntityByRelationshipName(parentRelnName) {
        return this.getEntities(/*true*/).find((entity) => {
            return entity.getRelationships(/*true*/).find((relationship) => {
                return relationship.name === parentRelnName;
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

    getElementById(id, includeSelf) {
        return this.getAllElements(includeSelf).find((element) => String(element.id) === String(id));
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

    createNewInstance() {
        return {
            domainName: 'UNDEFINED',
            isRootInstance: true,
            parentID: null
        };
    }

    getEntityByInstance(instance) {
        // FIXME: The type can change, for now, assuming type is the name of the
        // entity.
        return this.getEntityByName(instance.type);
    }

    getEntityById(entityId) {
        const entities = this.getEntities().filter((entity) => String(entity.id) === String(entityId));
        if (entities.length === 1) {
            return entities.pop();
        } else {
            throw new DomainError(`Cannot find entity with id=${entityId}.`);
        }
    }

    /**
     *  Retrieve all entities that are documents.
     */
    getDocumentEntities() {
        return this.getEntities().filter((entity) => entity.isDocument() && !entity.isAbstract);
    }
}

module.exports = Domain;
