"use strict";
var partUtils = require('util.parts');

const CORE_PARTS = [HEAL,  MOVE]; //300
const REPEAT_PARTS = [HEAL,  MOVE]; //300

module.exports.getBodyInfo = function(energy) {
    return partUtils.get(CORE_PARTS, REPEAT_PARTS, Math.min(energy, 600));
}

module.exports.onCreate = function(name, memory) {
}

module.exports.onDestroy = function(name, memory) { 
    unclaimTarget(memory);
}

module.exports.update = function(creep, memory, actions) {
    var baseMemory = Memory.bases[memory.base];
    var coreSpawn = Game.spawns[baseMemory.spawns[0]];

    unclaimTarget(memory);

    var target = findTarget(creep, baseMemory);
    if (target) {
        creep.memory.target = target.name;
        target.memory.healer = creep.id;
        if (actions.heal(creep, target, true)) {
            actions.rangedHeal(creep, target, false);
            return;
        }
    }
}

function findTarget(creep, baseMemory) {
    for (let role in baseMemory.roles) {
        var creeps = baseMemory.roles[role].creeps;
        for (let i = 0; i < creeps.length; i++) {
            var creep = Game.creeps[creeps[i]];
            if (creep && creep.hits !== creep.hitsMax)
                return creep;
        }
    }
    return null;
}

function unclaimTarget(memory) {    
    if (memory.target) {
        var target = Game.creeps[memory.target];
        if (target && target.memory)
            delete target.memory.healer;
        delete memory.target;
    }
}