"use strict";
var listUtils = require("util.list");
var mapUtils = require("util.map");
var requestUtils = require("util.requests");

module.exports.updateGlobal = function(actions) {
}

module.exports.updateBase = function(base, actions, creepRequests, structureRequests, defenseRequests) {
    var baseMemory = base.memory;
    var level = Game.rooms[base.name].controller.level;
    var roles = baseMemory.roles;
    var simpleHarvesterCount = roles['harvester_simple'].creeps.length;
    var harvesters = roles['harvester'];
    var collectorCount = roles['collector'].creeps.length;
    var harvesterWorkPartCount = harvesters.parts.work;

    for (let i = 0; i < baseMemory.sources.length; i++) {
        var sourceMemory = Memory.sources[baseMemory.sources[i]];
        var maxHarvesters = sourceMemory.maxHarvesters;

        //Update containers
        var room = Game.rooms[sourceMemory.room];
        var containerMemory = sourceMemory.container;
        if (room) {
            containerMemory.amount = 0;
            checkContainer(room, containerMemory);
        }

        //Adjust max harvesters to a more reasonable value
        if (maxHarvesters > 2)
            maxHarvesters = 2;
        
        var sourceHarvesters = sourceMemory.harvesters;
        if (containerMemory.amount < 2000 && sourceHarvesters.length < maxHarvesters) {
            var sourceWorkParts = 0;
            for (let j = 0; j < sourceHarvesters.length; j++) {
                var creepMemory = Memory.creeps[sourceHarvesters[j]];
                if (!creepMemory) {
                    listUtils.removeAt(sourceHarvesters, j--);
                    continue;
                }
                sourceWorkParts += creepMemory.parts.work;
            }

            var maxSourceWorkParts;
            var room = Game.rooms[sourceMemory.room];
            if (!room || !mapUtils.isReserved(room))
                maxSourceWorkParts = 3;
            else
                maxSourceWorkParts = 6;

            if (sourceWorkParts < maxSourceWorkParts && harvesterWorkPartCount < 42) {
                var id = baseMemory.sources[i];
                var roomMemory = Memory.rooms[Memory.sources[id].room];
                if (roomMemory && roomMemory.threatLevel === 0) {
                    var priority;
                    var memory = {
                        role: 'harvester',
                        target: id
                    };
                    if ((harvesters.creeps.length + simpleHarvesterCount) < 3 && collectorCount < 3) {
                        priority = 0.99;
                        memory.role = 'harvester_simple';
                    }
                    else if (sourceHarvesters.length === 0)
                        priority = 0.96;
                    else
                        priority = 0.80;
                    requestUtils.add(creepRequests, priority, memory);
                }
            }
        }
    }

    if (level >= 6) {
        for (let i = 0; i < baseMemory.minerals.length; i++) {
            var mineralMemory = Memory.minerals[baseMemory.minerals[i]];
            var maxMiners = mineralMemory.maxMiners;

            //Update containers
            var room = Game.rooms[mineralMemory.room];
            var containerMemory = mineralMemory.container;
            var extractorMemory = mineralMemory.extractor;
            if (room) {
                containerMemory.amount = 0;
                checkContainer(room, containerMemory);
                checkExtractor(room, extractorMemory, mineralMemory.pos);
            }

            //Adjust max miners to a more reasonable value
            if (maxMiners > 1)
                maxMiners = 1;
            
            var mineralMiners = mineralMemory.miners;
            if (extractorMemory.id && containerMemory.id && containerMemory.amount < 2000 && mineralMemory.miners.length < maxMiners) {
                var sourceWorkParts = 0;
                for (let j = 0; j < mineralMiners.length; j++) {                    
                    var creepMemory = Memory.creeps[mineralMiners[j]];
                    if (!creepMemory) {
                        listUtils.removeAt(mineralMiners, j--);
                        continue;
                    }
                    sourceWorkParts += Memory.creeps[mineralMiners[j]].parts.work;
                }

                var room = Game.rooms[mineralMemory.room];
                if (sourceWorkParts < 6) {
                    var id = baseMemory.minerals[i];
                    var roomMemory = Memory.rooms[Memory.minerals[id].room];
                    if (roomMemory && roomMemory.threatLevel === 0) {
                        var priority;
                        var memory = {
                            role: 'miner',
                            target: id
                        };
                        if (mineralMiners.length === 0)
                            priority = 0.96;
                        else
                            priority = 0.80;
                        requestUtils.add(creepRequests, priority, memory);
                    }
                }
            }
        }
    }
}

function checkContainer(room, containerMemory) {
    if (containerMemory.id) {
        delete containerMemory.site;
        var container = Game.getObjectById(containerMemory.id);
        if (container)
            containerMemory.amount = _.sum(container.store);
        else
            containerMemory.id = null; //Destroyed
    }
    else if (containerMemory.site) {
        var site = Game.constructionSites[containerMemory.site];
        if (!site)
            delete containerMemory.site;
    }

    if (!containerMemory.id && !containerMemory.site) {
        var pos = mapUtils.deserializePos(containerMemory.pos);
        if (pos) {
            if (room.createConstructionSite(pos.x, pos.y, STRUCTURE_CONTAINER) !== OK) {
                var structures = pos.lookFor(LOOK_STRUCTURES);
                for (let j = 0; j < structures.length; j++) {
                    if (structures[j].structureType === STRUCTURE_CONTAINER) {
                        containerMemory.id = structures[j].id;
                        break;
                    }
                }
                var sites = pos.lookFor(LOOK_CONSTRUCTION_SITES);
                for (let j = 0; j < sites.length; j++) {
                    if (sites[j].structureType === STRUCTURE_CONTAINER) {
                        containerMemory.site = sites[j].id;
                        break;
                    }
                }
            }
        }
    }
}

function checkExtractor(room, extractorMemory, pos) {
    if (extractorMemory.id) {
        delete extractorMemory.site;
        var container = Game.getObjectById(extractorMemory.id);
        if (!container)
            extractorMemory.id = null; //Destroyed
    }
    else if (extractorMemory.site) {
        var site = Game.constructionSites[extractorMemory.site];
        if (!site)
            delete extractorMemory.site;
    }

    if (!extractorMemory.id && !extractorMemory.site) {
        var pos = mapUtils.deserializePos(pos);
        if (pos) {
            if (room.createConstructionSite(pos.x, pos.y, STRUCTURE_EXTRACTOR) !== OK) {
                var structures = pos.lookFor(LOOK_STRUCTURES);
                for (let j = 0; j < structures.length; j++) {
                    if (structures[j].structureType === STRUCTURE_EXTRACTOR) {
                        extractorMemory.id = structures[j].id;
                        break;
                    }
                }
                var sites = pos.lookFor(LOOK_CONSTRUCTION_SITES);
                for (let j = 0; j < sites.length; j++) {
                    if (sites[j].structureType === STRUCTURE_EXTRACTOR) {
                        extractorMemory.site = sites[j].id;
                        break;
                    }
                }
            }
        }
    }
}