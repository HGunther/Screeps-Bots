"use strict";
var listUtils = require("util.list");
var mapUtils = require("util.map");
var requestUtils = require("util.requests");

module.exports.updateGlobal = function(actions) {
}

module.exports.updateBase = function(base, actions, creepRequests, structureRequests, defenseRequests) {
    var baseMemory = base.memory;
    var level = Game.rooms[base.name].controller.level;
    var roles = baseMemory.roles;
    var defenseBuilders = roles['builder_defense'];
    var defenseBuilderWorkParts = defenseBuilders.parts.work;
    var roadBuilders = roles['builder_road'];
    var roadBuilderWorkParts = roadBuilders.parts.work;
    var structureBuilders = roles['builder_structure'];
    var structureBuilderWorkParts = structureBuilders.parts.work;
    var repairers = roles['repairer'];
    var healerCount = roles['healer'].creeps.length;
    var towerCount = baseMemory.structures[STRUCTURE_TOWER].length;
    var structureTarget = null, roadTarget = null, defenseTarget = null;
    var structureRepairTargets = [], criticalDefenseRepairTargets = [], defenseRepairTargets = [], roadRepairTargets = []
    
    //Find structures to repair
    for (let type in baseMemory.structures) {
        var structures = baseMemory.structures[type];
        for (let i = 0; i < structures.length; i++) {
            var structure = Game.structures[structures[i]];
            if (structure && structure.hits < structure.hitsMax)
                listUtils.add(structureRepairTargets, structure.id);
        }
    }
    for (let i = 0; i < baseMemory.minerals.length; i++) {
        var mineralMemory = Memory.minerals[baseMemory.minerals[i]];
        if (mineralMemory.container.id) {
            var container = Game.getObjectById(mineralMemory.container.id);
            if (container && container.hits < container.hitsMax)
                listUtils.add(structureRepairTargets, container.id);
        }
    }
    for (let i = 0; i < baseMemory.rooms.length; i++) {
        var room = Game.rooms[baseMemory.rooms[i]];
        if (room) {
            //Search for any hurt road
            var targets = room.find(FIND_STRUCTURES, { filter: x => {
                return (x.structureType === STRUCTURE_ROAD &&
                    x.hits < x.hitsMax);
            }});
            if (targets.length !== 0) {
                for (let j = 0; j < targets.length; j++)
                    listUtils.add(roadRepairTargets, targets[j].id);
            }

            //Search for any hurt wall
            for (let hits = 10000; hits <= 1000000000; hits *= 10) {
                var targets = room.find(FIND_STRUCTURES, { filter: x => {
                    return ((x.structureType === STRUCTURE_RAMPART && x.my) ||
                        x.structureType === STRUCTURE_WALL) &&
                        x.hits < hits;
                }});
                if (targets.length > 0) {
                    for (let j = 0; j < targets.length; j++) {
                        var target = targets[j];
                        if (hits === 10000 && target.structureType === STRUCTURE_RAMPART)
                            listUtils.add(criticalDefenseRepairTargets, target.id);
                        else
                            listUtils.add(defenseRepairTargets, targets[j].id);
                    }
                    break;
                }
            }          
        }
    }
    //Find next build targets for this base
    while (baseMemory.construction.structures.length !== 0) {
        var obj = Game.constructionSites[baseMemory.construction.structures[0]];
        if (obj) {
            structureTarget = obj.id;
            break;
        }
        else
            baseMemory.construction.structures.shift();
    }
    while (baseMemory.construction.roads.length !== 0) {
        var obj = Game.constructionSites[baseMemory.construction.roads[0]];
        if (obj) {
            roadTarget = obj.id;
            break;
        }
        else
            baseMemory.construction.roads.shift();
    }
    while (baseMemory.construction.defenses.length !== 0) {
        var obj = Game.constructionSites[baseMemory.construction.defenses[0]];
        if (obj) {
            defenseTarget = obj.id;
            break;
        }
        else
            baseMemory.construction.defenses.shift();
    }

    //Assign targets to builders
    var targetGroups = [
        [structureTarget],
        [roadTarget], 
        criticalDefenseRepairTargets, 
        [defenseTarget], 
        structureRepairTargets, 
        roadRepairTargets,
        defenseRepairTargets 
    ];
    for (let i = 0; i < structureBuilders.creeps.length; i++) {
        var creepMemory = Memory.creeps[structureBuilders.creeps[i]];
        if (!creepMemory.target) {
            var pos = Game.creeps[structureBuilders.creeps[i]].pos;
            creepMemory.target = findTarget(pos, targetGroups);
        }
    }
    
    var targetGroups = [
        [roadTarget], 
        [structureTarget], 
        criticalDefenseRepairTargets, 
        [defenseTarget], 
        roadRepairTargets,
        structureRepairTargets, 
        defenseRepairTargets
    ];
    for (let i = 0; i < roadBuilders.creeps.length; i++) {
        var creepMemory = Memory.creeps[roadBuilders.creeps[i]];
        if (!creepMemory.target) {
            var pos = Game.creeps[roadBuilders.creeps[i]].pos;
            creepMemory.target = findTarget(pos, targetGroups);
        }
    }

    var targetGroups = [
        criticalDefenseRepairTargets, 
        [defenseTarget], 
        [roadTarget], 
        [structureTarget], 
        defenseRepairTargets, 
        roadRepairTargets,
        structureRepairTargets
    ];
    for (let i = 0; i < defenseBuilders.creeps.length; i++) {
        var creepMemory = Memory.creeps[defenseBuilders.creeps[i]];
        if (!creepMemory.target) {
            var pos = Game.creeps[defenseBuilders.creeps[i]].pos;
            creepMemory.target = findTarget(pos, targetGroups);
        }
    }        
    
    var targetGroups = [
        criticalDefenseRepairTargets, 
        roadRepairTargets,
        structureRepairTargets,
        [roadTarget], 
        [structureTarget], 
        [defenseTarget], 
        defenseRepairTargets
    ];
    for (let i = 0; i < repairers.creeps.length; i++) {
        var creepMemory = Memory.creeps[repairers.creeps[i]];
        if (!creepMemory.target) {
            var pos = Game.creeps[repairers.creeps[i]].pos;
            creepMemory.target = findTarget(pos, targetGroups);
        }
    }

    //Request more creeps        
    if ((repairers.creeps.length === 0 && towerCount === 0) || repairers.creeps.length < level) {
        var priority;
        var memory = { role: 'repairer' };
        if (repairers.creeps.length === 0 || repairers.creeps.length < Math.floor(baseMemory.rooms.length * 0.67))
            priority = 0.83;
        else
            priority = 0.62;
        requestUtils.add(creepRequests, priority, memory);
    }

    if (healerCount < 1 && baseMemory.threatLevel !== 0) {
        var memory = { role: 'healer' };
        requestUtils.add(creepRequests, 0.89, memory);
    }

    if (level >= 2 && roadBuilders.creeps.length < 3 &&
            roadBuilderWorkParts < (level - 1)) {
        var priority;
        var memory = { role: 'builder_road' };
        if (roadBuilderWorkParts === 0)
            priority = 0.86;
        else if (roadBuilderWorkParts < level)
            priority = 0.75;
        else
            priority = 0.66;
        requestUtils.add(creepRequests, priority, memory);
    }

    if (level >= 2 && structureBuilders.creeps.length < 2 &&
            structureBuilderWorkParts < (level - 1) && baseMemory.construction.structures.length > 0) {
        var priority;
        var memory = { role: 'builder_structure' };
        if (structureBuilderWorkParts === 0)
            priority = 0.85;
        else if (structureBuilderWorkParts < level)
            priority = 0.74;
        else
            priority = 0.65;
        requestUtils.add(creepRequests, priority, memory);
    }

    if (level >= 2 && defenseBuilders.creeps.length < 2 && 
            defenseBuilderWorkParts < (level - 1)) {
        var priority;
        var memory = { role: 'builder_defense' };
        if (defenseBuilderWorkParts === 0)
            priority = 0.84;
        else if (defenseBuilderWorkParts < level)
            priority = 0.73;
        else
            priority = 0.64;
        requestUtils.add(creepRequests, priority, memory);
    }
}

function findTarget(pos, targetGroups) {
    for (let i = 0; i < targetGroups.length; i++) {
        var group = targetGroups[i];
        var bestDistance = 9999;
        var bestTarget = null;
        for (let j = 0; j < group.length; j++) {
            if (group[j]) {
                var structure = Game.getObjectById(group[j]);
                if (structure) {
                    var targetPos = structure.pos;
                    var distance;
                    if (pos.roomName !== targetPos.roomName)
                        distance = Game.map.getRoomLinearDistance(pos.roomName, targetPos.roomName) * 50;
                    else
                        distance = pos.getRangeTo(targetPos);
                    if (distance < bestDistance) {
                        bestDistance = distance;
                        bestTarget = structure.id;
                    }
                }
            }
        } 
        if (bestTarget)
            return bestTarget;
    }
    return null;
}