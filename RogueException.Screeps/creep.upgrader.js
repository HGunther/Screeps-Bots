"use strict";
var mapUtils = require('util.map');
var partUtils = require('util.parts');

const CORE_PARTS = [WORK, CARRY, CARRY, MOVE, MOVE];
const REPEAT_PARTS = [WORK, CARRY, MOVE];

module.exports.getBodyInfo = function(energy) {
    //Max size carries 50
    return partUtils.get(CORE_PARTS, REPEAT_PARTS, energy);
}

module.exports.onCreate = function(name, memory) {
}

module.exports.onDestroy = function(name, memory) {     
}

module.exports.update = function(creep, memory, actions) {
    var baseMemory = Memory.bases[memory.base];
    var coreSpawn = Game.spawns[baseMemory.spawns[0]];

    if(creep.carry.energy < 50) {
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
    if (actions.upgrade(creep, target, true))
        return;
}