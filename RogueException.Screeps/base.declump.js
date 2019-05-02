"use strict";

module.exports.updateGlobal = function(actions) {
}

module.exports.updateBase = function(base, actions, creepRequests, structureRequests, defenseRequests) {
    var baseMemory = base.memory;

    //Declump around spawns
    var spawns = baseMemory.spawns;    
    for (let i = 0; i < spawns.length; i++) {
        var spawn = Game.spawns[spawns[i]];
        if (spawn) {
            var pos = spawn.pos;
            var targets = spawn.room.lookForAtArea(LOOK_CREEPS, pos.y - 2, pos.x - 2, pos.y + 2, pos.x + 2, true);
            for (let j = 0; j < targets.length; j++) {
                if (!actions.hasAnyAction(targets[j].creep))
                    actions.flee(targets[j].creep, spawn, 3, true);
            }
        }
    }
    
    //Declump around storages   
    var storages = baseMemory.structures[STRUCTURE_STORAGE];
    for (let i = 0; i < storages.length; i++) {
        var storage = Game.structures[storages[i]];
        if (storage) {
            var pos = storage.pos;
            var targets = storage.room.lookForAtArea(LOOK_CREEPS, pos.y - 2, pos.x - 2, pos.y + 2, pos.x + 2, true);
            for (let j = 0; j < targets.length; j++) {
                if (!actions.hasAnyAction(targets[j].creep))
                    actions.flee(targets[j].creep, storage, 3, true);
            }
        }
    }
}