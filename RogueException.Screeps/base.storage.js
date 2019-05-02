"use strict";
var listUtils = require("util.list");
var requestUtils = require("util.requests");

module.exports.updateGlobal = function(actions) {
}

module.exports.updateBase = function(base, actions, creepRequests, structureRequests, defenseRequests) {
    var baseMemory = base.memory;
    
    var dropoffs = [];
    var hasStorage = false;
    if (baseMemory.roles.recharger_core.creeps.length !== 0) {
        var storages = baseMemory.structures[STRUCTURE_STORAGE];
        hasStorage = true;
        storages = _.filter(storages, x => Game.structures[x].store.energy < 500000); //Limit energy to 50% of a storage
        dropoffs = dropoffs.concat(storages);
    }
    dropoffs = dropoffs.concat(baseMemory.structures[STRUCTURE_SPAWN]);
    if (hasStorage === false) //Don't crowd around extensions
        dropoffs = dropoffs.concat(baseMemory.structures[STRUCTURE_EXTENSION]);

    base.dropoffs = _.filter(dropoffs, x => {
        var structure = Game.structures[x];
        if (!structure)
            return false;
        else if (structure.store)
            return (structure.storeCapacity - _.sum(structure.store)) > 0;
        else
            return (structure.energyCapacity - structure.energy) > 0;
    });
    
    var pickups = baseMemory.structures[STRUCTURE_STORAGE];
    var corePickups = baseMemory.structures[STRUCTURE_SPAWN]
        .concat(baseMemory.structures[STRUCTURE_EXTENSION]);

    base.pickups = _.filter(pickups, x => {
        var structure = Game.structures[x];
        if (!structure)
            return false;
        else if (structure.store)
            return structure.store.energy > 0;
        else
            return structure.energy > 0;
    });
    base.corePickups = _.filter(corePickups, x => {
        var structure = Game.structures[x];
        if (!structure)
            return false;
        else if (structure.store)
            return structure.store.energy > 0;
        else
            return structure.energy > 0;
    });

    var droppedEnergy = [];
    for (var i = 0; i < baseMemory.rooms.length; i++) {
        var room = Game.rooms[baseMemory.rooms[i]];
        if (room) {
            var roomResources = room.find(FIND_DROPPED_ENERGY);
            for (var j = 0; j < roomResources.length; j++) {
                var resource = roomResources[j];
                if (resource.amount >= 100)
                    listUtils.add(droppedEnergy, resource.id);
            }
        }
    }
    base.droppedEnergy = droppedEnergy;
}