"use strict";
var mapUtils = require('util.map');
var partUtils = require('util.parts');

const CORE_PARTS = [WORK, CARRY, MOVE];
const REPEAT_PARTS = [];

module.exports.getBodyInfo = function(energy) {
    return partUtils.get(CORE_PARTS, REPEAT_PARTS, energy);
}

module.exports.onCreate = function(name, memory) {
}

module.exports.onDestroy = function(name, memory) {     
}

module.exports.update = function(creep, memory, actions) {
    var baseMemory = Memory.bases[memory.base];
    var coreSpawn = Game.spawns[baseMemory.spawns[0]];
                
    if(creep.carry.energy < creep.carryCapacity) {
        var mayUseSpawn = baseMemory.construction.requestedCreepPriority < 0.80;
        var storage = mapUtils.findStorage(creep.pos, Game.bases[memory.base], creep.carryCapacity - creep.carry.energy, mayUseSpawn);
        if (storage) {
            if (actions.withdraw(creep, storage, true))
                return;
        }
    }

    var target = Game.structures[memory.target];
    if (!target)
        target = Game.getObjectById(memory.target);
    if (creep.carry.energy > 0) {
        if (actions.maintain(creep, target, true))
            return;
    }
}