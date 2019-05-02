"use strict";
var listUtils = require('util.list');
var mapUtils = require('util.map');
var partUtils = require('util.parts');

const CORE_PARTS = [MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, WORK, WORK]; //600
const REPEAT_PARTS = [];

module.exports.getBodyInfo = function(energy) {
    //Max size has 2 work and carries 100
    return partUtils.get(CORE_PARTS, REPEAT_PARTS, Math.min(600, energy));
}

module.exports.onCreate = function(name, memory) {
    listUtils.add(Memory.sources[memory.source].harvesters, name);
}

module.exports.onDestroy = function(name, memory) {
    listUtils.remove(Memory.sources[memory.source].harvesters, name);    
}

module.exports.update = function(creep, memory, actions) {
    if (memory.room && creep.pos.roomName !== memory.room) {
        var pos = creep.pos.findClosestByPath(creep.room.findExitTo(memory.room));
        if (pos)
            actions.moveTo(creep, pos, true);
        return;
    }

    if(creep.carry.energy < 25) {        
        if(creep.carry.energy < creep.carryCapacity) {
            var source = Game.getObjectById(memory.source);
            if (actions.harvest(creep, source, true))
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
            var baseMemory = Memory.bases[memory.room];
            if (baseMemory) {
                var spawn = Game.spawns[baseMemory.spawns[0]];
                if (spawn) {
                    actions.recycle(creep, spawn, true);
                    return;
                }
            }
        }
    }
}