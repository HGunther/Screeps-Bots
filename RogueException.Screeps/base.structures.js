"use strict";
var requestUtils = require("util.requests");

module.exports.updateGlobal = function(actions) {
}

module.exports.updateBase = function(base, actions, creepRequests, structureRequests, defenseRequests) {
    var baseMemory = base.memory;
    var level = Game.rooms[base.name].controller.level;
    
    var spawnCount = baseMemory.structures[STRUCTURE_SPAWN].length;
    if (spawnCount < CONTROLLER_STRUCTURES[STRUCTURE_SPAWN][level]) {
        var priority;
        if (spawnCount === 0)
            priority = 1.0;
        else
            priority = 0.85;
        requestUtils.add(structureRequests, priority, STRUCTURE_SPAWN);
    }

    var storageCount = baseMemory.structures[STRUCTURE_STORAGE].length;
    if (storageCount < CONTROLLER_STRUCTURES[STRUCTURE_STORAGE][level]) {
        var priority;
        if (storageCount === 0)
            priority = 0.90;
        else
            priority = 0.80;
        requestUtils.add(structureRequests, priority, STRUCTURE_STORAGE);
    }

    var extensionCount = baseMemory.structures[STRUCTURE_EXTENSION].length;
    if (extensionCount < CONTROLLER_STRUCTURES[STRUCTURE_EXTENSION][level]) {
        var priority;
        if (extensionCount < 5)
            priority = 0.98;
        else if (extensionCount < 10)
            priority = 0.88;
        else
            priority = 0.78;
        requestUtils.add(structureRequests, priority, STRUCTURE_EXTENSION);
    }

    var towerCount = baseMemory.structures[STRUCTURE_TOWER].length;
    if (towerCount < CONTROLLER_STRUCTURES[STRUCTURE_TOWER][level]) {
        var priority;
        if (towerCount === 0)
            priority = 0.94;
        else
            priority = 0.84;
        requestUtils.add(structureRequests, priority, STRUCTURE_TOWER);
    }
    
    requestUtils.add(defenseRequests, 0.5, STRUCTURE_WALL);
    requestUtils.add(defenseRequests, 0.49, STRUCTURE_RAMPART);
}