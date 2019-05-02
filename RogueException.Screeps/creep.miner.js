"use strict";
var listUtils = require('util.list');
var mapUtils = require('util.map');
var partUtils = require('util.parts');

const CORE_PARTS = [WORK, WORK, CARRY, MOVE]; //300
const REPEAT_PARTS = [WORK, MOVE]; //150

module.exports.getBodyInfo = function(energy) {
    //Max size has 6 work
    return partUtils.get(CORE_PARTS, REPEAT_PARTS, Math.min(energy, 900));
}

module.exports.onCreate = function(name, memory) {
    listUtils.add(Memory.minerals[memory.target].miners, name);
}

module.exports.onDestroy = function(name, memory) {
    listUtils.remove(Memory.minerals[memory.target].miners, name);    
}

module.exports.update = function(creep, memory, actions) {
    var baseMemory = Memory.bases[memory.base];
    var coreSpawn = Game.spawns[baseMemory.spawns[0]];

    var target = Game.getObjectById(memory.target);
    if (!target) {
        var pos = mapUtils.deserializePos(Memory.minerals[memory.target].pos);
        actions.moveTo(creep, pos);
        return;        
    }
    else {
        var mineralMemory = Memory.minerals[memory.target];
        if (mineralMemory.container.id) {
            var structure = Game.getObjectById(mineralMemory.container.id);
            if (structure) {
                var isFull = _.sum(creep.carry) === creep.carryCapacity;
                if (actions.deposit(creep, structure, isFull, mineralMemory.type))
                    return;
            }
        }
        if (mineralMemory.extractor.id) {
            if (_.sum(creep.carry) !== creep.carryCapacity) {
                if (actions.harvest(creep, target, true))
                    return;
            }
        }
    }
}