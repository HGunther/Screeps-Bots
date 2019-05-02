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
    listUtils.add(Memory.sources[memory.target].harvesters, name);
}

module.exports.onDestroy = function(name, memory) {
    listUtils.remove(Memory.sources[memory.target].harvesters, name);    
}

module.exports.update = function(creep, memory, actions) {
    var baseMemory = Memory.bases[memory.base];
    var coreSpawn = Game.spawns[baseMemory.spawns[0]];

    var target = Game.getObjectById(memory.target);
    if (!target) {
        var pos = mapUtils.deserializePos(Memory.sources[memory.target].pos);
        actions.moveTo(creep, pos);
        return;        
    }
    else {
        var sourceMemory = Memory.sources[memory.target];
        if (sourceMemory.container.id) {
            var structure = Game.getObjectById(sourceMemory.container.id);
            if (structure) {
                var isFull = _.sum(creep.carry) === creep.carryCapacity;
                if (structure.hits < structure.hitsMax) {
                    if (actions.repair(creep, structure, isFull))
                        return;
                }
                else {
                    if (actions.deposit(creep, structure, isFull))
                        return;
                }
            }
        }
        else if (sourceMemory.container.site) {
            var site = Game.constructionSites[sourceMemory.container.site];
            if (site) {
                sourceMemory.container.id = null;
                if (actions.build(creep, site, isFull))
                    return;
            }
        }
        if (_.sum(creep.carry) !== creep.carryCapacity) {
            if (actions.harvest(creep, target, true))
                return;
        }
    }
}