"use strict";
var mapUtils = require('util.map');
var partUtils = require('util.parts');

const CORE_PARTS = [CARRY, CARRY, CARRY, MOVE, MOVE, MOVE]; //300
const REPEAT_PARTS = [CARRY, MOVE]; //100

module.exports.getBodyInfo = function(energy) {
    return partUtils.get(CORE_PARTS, REPEAT_PARTS, Math.min(energy, 500));
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

    if (creep.carry.energy > 0) {
        var energy = Math.floor(creep.carry.energy / 50) * 50;
        var target = findTarget(creep, energy);

        //console.log(creep.name + ': give to ' + target);
        if (target) {
            creep.memory.target = target.id;
            if (target.structureType) { //Is Structure?
                if (actions.deposit(creep, target, true))
                    return;
            }
            else {
                target.memory.recharger = creep.id;
                if (actions.giveTo(creep, target, true))
                    return;
            }
        }
    }
    else {
        var mayUseSpawn = baseMemory.construction.requestedCreepPriority < 0.80 && baseMemory.structures[STRUCTURE_STORAGE].length === 0;
        var storage = mapUtils.findStorage(creep.pos, Game.bases[memory.base], creep.carryCapacity - creep.carry.energy, mayUseSpawn);
        //console.log(creep.name + ': take from ' + storage);
        if (storage) {
            if (actions.withdraw(creep, storage, true))
                return;
        }
    }
}

function findTarget(creep, neededEnergy) {
    var baseMemory = Memory.bases[creep.memory.base];
    if (neededEnergy === 0)
        neededEnergy = 25;

    for (let energy = neededEnergy; energy >= 0; energy -= 50) {
        var targetStructure = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, { filter: (x) => {
            var type = x.structureType;
            return (type === STRUCTURE_TOWER) && 
                (x.energyCapacity - x.energy) >= energy;
        }});
        if (targetStructure)
            return targetStructure;
            
        var targetCreep = creep.pos.findClosestByPath(FIND_MY_CREEPS, { filter: (x) => {
            var role = x.memory.role;
            return (role === 'upgrader') && 
                !x.memory.recharger &&
                (x.carryCapacity - x.carry.energy) >= energy;
        }});
        if (targetCreep)
            return targetCreep;
    }
    
    for (let energy = neededEnergy; energy >= 0; energy -= 50) {
        if (baseMemory.structures[STRUCTURE_STORAGE].length !== 0) {
            var targetStructure = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, { filter: (x) => {
                var type = x.structureType;
                return (type === STRUCTURE_SPAWN || type === STRUCTURE_EXTENSION) && 
                    (x.energyCapacity - x.energy) >= energy;
            }});
            if (targetStructure)
                return targetStructure;
        }
    }
}

function unclaimTarget(memory) {    
    if (memory.target) {
        var target = Game.getObjectById(memory.target);
        if (target && target.memory)
            delete target.memory.recharger;
        delete memory.target;
    }
}