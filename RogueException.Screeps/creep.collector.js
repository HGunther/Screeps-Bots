"use strict";
var listUtils = require('util.list');
var mapUtils = require('util.map');
var partUtils = require('util.parts');

const CORE_PARTS = [CARRY, CARRY, CARRY, CARRY, MOVE, MOVE]; //300
const REPEAT_PARTS = [CARRY, CARRY, MOVE]; //150

module.exports.getBodyInfo = function(energy) {
    //Max size carries 500
    return partUtils.get(CORE_PARTS, REPEAT_PARTS, Math.min(750, energy));
}

module.exports.onCreate = function(name, memory) {
}

module.exports.onDestroy = function(name, memory) {
    unclaimTarget(name, memory);
}

module.exports.update = function(creep, memory, actions) {
    var baseMemory = Memory.bases[memory.base];
    var coreSpawn = Game.spawns[baseMemory.spawns[0]];
           
    if (memory.target) {
        var sourceMemory = Memory.sources[memory.target];
        var id = sourceMemory.container.id;
        var container = Game.getObjectById(id);
        if (!id)
            unclaimTarget(creep.name, memory);
        else if (!container) {
            var pos = mapUtils.deserializePos(sourceMemory.pos);
            actions.moveTo(creep, pos);
            return;
        }
        else if (_.sum(creep.carry) !== creep.carryCapacity && container.store.energy > 25) {
            if (actions.withdraw(creep, container, true))
                return;
        }
        else
            unclaimTarget(creep.name, memory);
    }
    else if (creep.carry.energy > 0) {
        var dropoff = mapUtils.findDropoff(creep.pos, Game.bases[memory.base], creep.carry.energy);
        if (dropoff) {
            actions.deposit(creep, dropoff, true);
            return;
        }
    }
}

function unclaimTarget(name, memory) {
    if (memory.target) {
        listUtils.remove(Memory.sources[memory.target].collectors, name);    
        memory.target = null;
    }
}