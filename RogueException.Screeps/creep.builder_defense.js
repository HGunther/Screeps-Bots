"use strict";
var mapUtils = require('util.map');
var partUtils = require('util.parts');

const CORE_PARTS = [WORK, CARRY, MOVE, MOVE]; //250
const REPEAT_PARTS = [WORK, CARRY, CARRY, CARRY, MOVE, MOVE]; //350

module.exports.getBodyInfo = function(energy) {
    //Max size has 2 work and carries 200
    return partUtils.get(CORE_PARTS, REPEAT_PARTS, Math.min(600, energy));
}

module.exports.onCreate = function(name, memory) {
}

module.exports.onDestroy = function(name, memory) {
}

module.exports.update = function(creep, memory, actions) {
    var baseMemory = Memory.bases[memory.base];
    var coreSpawn = Game.spawns[baseMemory.spawns[0]];

    if(creep.carry.energy < 25) {
        delete memory.target;
        var mayUseSpawn = baseMemory.construction.requestedCreepPriority < 0.80;
        var storage = mapUtils.findStorage(creep.pos, Game.bases[memory.base], creep.carryCapacity - creep.carry.energy, mayUseSpawn);
        if (storage) {
            if (actions.withdraw(creep, storage, true)) 
                return;
        }
    }

    if (memory.target) {
        var site = Game.constructionSites[memory.target]
        if (site) {
            if (actions.build(creep, site, true)) 
                return;
        }
        else {
            var structure = Game.structures[memory.target];
            if (!structure)
                structure = Game.getObjectById(memory.target);
            if (structure && structure.hits < structure.hitsMax) {
                if (actions.repair(creep, structure, true)) 
                    return;
            }
            else
                delete memory.target;
        }
    }
}