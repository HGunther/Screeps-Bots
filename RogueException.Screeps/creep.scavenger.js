"use strict";
var mapUtils = require('util.map');
var partUtils = require('util.parts');

const CORE_PARTS = [CARRY, MOVE]; //100
const REPEAT_PARTS = [];

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

    if(creep.carry.energy < creep.carryCapacity) {
        var base = Game.bases[memory.base];
        var target = mapUtils.findClosestByRange(creep.pos, base.droppedEnergy);
        if (target) {
            if (actions.pickup(creep, target, true))
                return;
        }
    }
    
    if (creep.carry.energy > 0) {
        var dropoff = mapUtils.findDropoff(creep.pos, Game.bases[memory.base], creep.carry.energy);
        if (dropoff) {
            if (actions.deposit(creep, dropoff, true))
                return;
        }
    }
}