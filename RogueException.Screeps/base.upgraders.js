"use strict";
var requestUtils = require("util.requests");

module.exports.updateGlobal = function(actions) {
}

module.exports.updateBase = function(base, actions, creepRequests, structureRequests, defenseRequests) {
    var baseMemory = base.memory;
    var controller = Game.rooms[base.name].controller;
    var coreSpawn = Game.spawns[baseMemory.spawns[0]];
    var level = controller.level;
    var roles = baseMemory.roles;    
    var upgraders = roles['upgrader'];
    var upgraderWorkParts = upgraders.parts.work;
    var maintainers = roles['maintainer'];
    
    //Emphasize upgrading once we have built all storage for that level
    var upgradeNeeded = 
        baseMemory.structures[STRUCTURE_EXTENSION].length >= CONTROLLER_STRUCTURES[STRUCTURE_EXTENSION][level] &&
        baseMemory.structures[STRUCTURE_STORAGE].length >= CONTROLLER_STRUCTURES[STRUCTURE_STORAGE][level] &&
        baseMemory.structures[STRUCTURE_SPAWN].length >= CONTROLLER_STRUCTURES[STRUCTURE_SPAWN][level];

    //Do we need a maintainer?
    if (controller.ticksToDowngrade < 2500) {
        if (maintainers.creeps.length === 0) {
            var memory = { role: 'maintainer', target: controller.id };
            requestUtils.add(creepRequests, 1.0, memory);
        }
    }
    else {
        //Destroy existing maintainers
        for (let i = 0; i < maintainers.creeps.length; i++) {
            var creep = Game.creeps[maintainers.creeps[i]];
            actions.recycle(creep, coreSpawn, true);
        }
    }
    
    //Do we need an upgrader?
    var maxUpgraderWorkParts = level * level;
    if (upgradeNeeded === false)
        maxUpgraderWorkParts /= 2;

    var memory = { role: 'upgrader', target: controller.id };
    if (upgraders.creeps.length < level && upgraders.parts.work < maxUpgraderWorkParts) {
        if (upgraders.creeps.length === 0)
            requestUtils.add(creepRequests, 0.80, memory);
        else
            requestUtils.add(creepRequests, 0.60, memory);
    }
    else if (upgraders.creeps.length < 10)
        requestUtils.add(creepRequests, 0.40, memory);
}