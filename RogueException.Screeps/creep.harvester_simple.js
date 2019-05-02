"use strict";
var listUtils = require('util.list');
var mapUtils = require('util.map');
var partUtils = require('util.parts');

const CORE_PARTS = [WORK, CARRY, MOVE, MOVE]; //250
const REPEAT_PARTS = [];

module.exports.getBodyInfo = function(energy) {
    return partUtils.get(CORE_PARTS, REPEAT_PARTS, energy);
}

module.exports.onCreate = function(name, memory) {
    listUtils.add(Memory.sources[memory.target].harvesters, name);
}

module.exports.onDestroy = function(name, memory) {
    listUtils.remove(Memory.sources[memory.target].harvesters, name);    
}

module.exports.update = function(creep, memory, actions) {
    var baseMemory = Memory.bases[memory.base];
    var coreSpawn = Game.spawns[baseMemory.spawns[0]];

    if(creep.carry.energy < creep.carryCapacity) {
        var target = Game.getObjectById(memory.target);
        if (!target) {
            var pos = mapUtils.deserializePos(Memory.sources[memory.target].pos);
            actions.moveTo(creep, pos);
            return;        
        }
        else {
            if (actions.harvest(creep, target, true))
                return;
        }
    }
    
    if (creep.carry.energy > 0) {
        var dropoff = mapUtils.findDropoff(creep.pos, Game.bases[memory.base], creep.carry.energy);
        var isFull = _.sum(creep.carry) === creep.carryCapacity;
        if (dropoff) {
            if (actions.deposit(creep, dropoff, isFull))
                return;
        }
    }
}