"use strict";
var listUtils = require("util.list");
var mapUtils = require("util.map");
var requestUtils = require("util.requests");

module.exports.updateGlobal = function(actions) {
    //Check for new construction sites
    for (let id in Game.constructionSites) {
        var site = Game.constructionSites[id];
        var siteMemory = Memory.constructionSites[id];
        if (!siteMemory) {
            var isBaseOwned = false;
            
            if (site.structureType === STRUCTURE_CONTAINER) {
                //Source containers in the home room, and mineral contains in any room are base-owned
                if (Memory.bases[site.pos.roomName])
                    isBaseOwned = true;
                else {
                    var roomMemory = Memory.rooms[site.pos.roomName];
                    if (roomMemory) {
                        var minerals = roomMemory.minerals;
                        for (let i = 0; i < minerals.length; i++) {
                            var mineralMemory = Memory.minerals[minerals[i]];
                            if (mapUtils.deserializePos(mineralMemory.container.pos).isEqualTo(site.pos))
                                isBaseOwned = true;
                        }
                    }
                }
            }
            else
                isBaseOwned = true;

            var bases = [];
            if (isBaseOwned === true) {
                for (let baseName in Memory.bases) {
                    var baseMemory = Memory.bases[baseName];
                    if (listUtils.contains(baseMemory.rooms, site.room.name)) {
                        if (site.structureType === STRUCTURE_ROAD)
                            listUtils.add(baseMemory.construction.roads, site.id);
                        else if (site.structureType === STRUCTURE_WALL || site.structureType === STRUCTURE_RAMPART)
                            listUtils.add(baseMemory.construction.defenses, site.id);
                        else
                            listUtils.add(baseMemory.construction.structures, site.id);
                        listUtils.add(bases, baseName);
                    }
                }
            }
            siteMemory = {
                bases: bases,
                pos: mapUtils.serializePos(site.pos),
                type: site.structureType
            }
            Memory.constructionSites[id] = siteMemory;
        }
    }

    //Check for completed construction sites
    for (let id in Memory.constructionSites) {
        var site = Game.constructionSites[id];
        if (!site) {
            var siteMemory = Memory.constructionSites[id];
            if (siteMemory.type !== STRUCTURE_CONTAINER) {
                for (let i = 0; i < siteMemory.bases.length; i++) {
                    var baseMemory = Memory.bases[siteMemory.bases[i]];
                    if (!baseMemory)
                        continue;
                    
                    if (siteMemory.type === STRUCTURE_ROAD)
                        listUtils.remove(baseMemory.construction.roads, id);
                    else if (siteMemory.type === STRUCTURE_WALL || siteMemory.type === STRUCTURE_RAMPART)
                        listUtils.remove(baseMemory.construction.defenses, id);
                    else
                        listUtils.remove(baseMemory.construction.structures, id);

                    if (siteMemory.type !== STRUCTURE_ROAD &&
                            siteMemory.type !== STRUCTURE_WALL &&
                            siteMemory.type !== STRUCTURE_RAMPART) {
                        var pos = mapUtils.deserializePos(siteMemory.pos);
                        var room = Game.rooms[pos.roomName];
                        if (room) {
                            var structures = pos.lookFor(LOOK_STRUCTURES);
                            var success = false;
                            for (let i = 0; i < structures.length; i++) {
                                var structure = structures[i];
                                if (structure.structureType === siteMemory.type) {
                                    listUtils.add(baseMemory.structures[siteMemory.type], structure.id);
                                    var structureMemory = {};
                                    if (siteMemory.type === STRUCTURE_SPAWN) {
                                        structureMemory.name = structure.name;
                                        listUtils.add(baseMemory.spawns, structure.name);
                                    }
                                    Memory.structures[structure.id] = structureMemory;
                                    success = true;
                                    break;
                                }
                            }
                            if (success === false)
                                recheckPlan(baseMemory); //Construction site destroyed or cancelled
                        }
                    }
                }
            }

            delete Memory.constructionSites[id];
        }
    }
}

module.exports.updateBase = function(base, actions, creepRequests, structureRequests, defenseRequests) {
    var baseMemory = base.memory;

    //Check for destroyed structures
    var lostStructure = false;
    for (let structureType in baseMemory.structures) {
        var structureIds = baseMemory.structures[structureType];
        for (let i = 0; i < structureIds.length; i++) {
            var id = structureIds[i];
            if (Game.structures[id] === undefined) {
                var structureMemory = Memory.structures[id];
                if (structureMemory)
                    delete Memory.structures[id];
                listUtils.removeAt(structureIds, i);

                if (structureType === STRUCTURE_SPAWN)
                    listUtils.remove(base.Memory.spawns, structureMemory.name);

                lostStructure = true;
                i--;
                console.log(base.name + ": Lost " + structureType + " (" + structureIds.length  + " left)");
            }
        }
    }
    if (lostStructure)
        recheckPlan(baseMemory);

    //Construct structures
    if (baseMemory.construction.structures.length === 0) {
        var success = false;
        while (!success) {
            var request = requestUtils.pop(structureRequests);
            if (request === null)
                break;

            var structureType = request.data;
            var queuedStructures = baseMemory.plan.queued[structureType];
            if (queuedStructures) {
                for (let i = 0; i < queuedStructures.length; i++) {
                    var pos = mapUtils.deserializePos(queuedStructures[i]);
                    var room = Game.rooms[pos.roomName];
                    if (room) {
                        var alreadyExists = false;

                        var structures = pos.lookFor(LOOK_STRUCTURES);
                        for (let j = 0; j < structures.length; j++) {
                            if (structures[j].structureType === structureType) {
                                alreadyExists = true;
                                break;
                            }
                        }

                        if (alreadyExists === false) {
                            var room = Game.rooms[pos.roomName];              
                            if (room && room.createConstructionSite(pos, structureType) === OK) {
                                console.log(base.name + ": Creating " + structureType + " (" + request.priority + ")");
                                success = true;
                            }
                        }

                        if (alreadyExists === true || success === true) {
                            listUtils.add(baseMemory.plan.built[structureType], queuedStructures[i]);
                            listUtils.removeAt(queuedStructures, i);
                            if (success === true)
                                break;
                        }
                    }
                }
            }
        }
    }

    //Construct defenses
    if (baseMemory.construction.defenses.length === 0) {
        var success = false;
        while (!success) {
            var request = requestUtils.pop(defenseRequests);
            if (request === null)
                break;

            var structureType = request.data;
            var queuedStructures = baseMemory.plan.queued[structureType];
            if (queuedStructures) {
                for (let i = 0; i < queuedStructures.length; i++) {
                    var pos = mapUtils.deserializePos(queuedStructures[i]);
                    var room = Game.rooms[pos.roomName];
                    if (room) {
                        var alreadyExists = false;

                        var structures = pos.lookFor(LOOK_STRUCTURES);
                        for (let j = 0; j < structures.length; j++) {
                            if (structures[j].structureType === structureType) {
                                alreadyExists = true;
                                break;
                            }
                        }

                        if (alreadyExists === false) {
                            var room = Game.rooms[pos.roomName];
                            if (room && room.createConstructionSite(pos, structureType) === OK) {
                                console.log(base.name + ": Creating " + structureType + " (" + request.priority + ")");
                                success = true;
                            }
                        }

                        if (alreadyExists === true || success === true) {
                            listUtils.add(baseMemory.plan.built[structureType], queuedStructures[i]);
                            listUtils.removeAt(queuedStructures, i);
                            if (success === true)
                                break;
                        }
                    }
                }
            }
        }
    }

    //Construct roads
    if (baseMemory.construction.roads.length === 0) {
        var queuedRoads = baseMemory.plan.queued.road;
        if (queuedRoads && queuedRoads.length > 0) {
            var path = queuedRoads[0];
            var isComplete = true;
            for (let i = 0; i < path.length; i++) {
                var pos = mapUtils.deserializePos(path[i]);
                var room = Game.rooms[pos.roomName];
                if (room) {
                    var structures = pos.lookFor(LOOK_STRUCTURES);

                    var skip = false;
                    if (pos.x !== 0 && pos.y !== 0 && pos.x !== 49 && pos.y !== 49) {
                        for (let j = 0; j < structures.length; j++) {
                            if (structures[j].structureType === STRUCTURE_ROAD ||
                                    structures[j].structureType === STRUCTURE_WALL)
                                skip = true;
                        }
                        if (skip === false) {
                            var room = Game.rooms[pos.roomName];
                            if (room && room.createConstructionSite(pos, STRUCTURE_ROAD) === OK)
                                console.log(base.name + ": Creating road");
                            isComplete = false;
                            break;
                        }
                    }
                }
                else
                    isComplete = false;
            }
            if (isComplete) {
                listUtils.add(baseMemory.plan.built.road, path);
                listUtils.removeAt(queuedRoads, 0);
            }
        }
    }
}

function recheckPlan(baseMemory) {        
    //Reset every structure to queued
    for (let key in baseMemory.plan.built) {
        baseMemory.plan.queued[key] = baseMemory.plan.queued[key].concat(baseMemory.plan.built[key]);
        baseMemory.plan.built[key] = [];
    }
}