"use strict";
var listUtils = require("util.list");

module.exports.updateGlobal = function(actions) {
}

module.exports.updateBase = function(base, actions, creepRequests, structureRequests, defenseRequests) {
    var baseMemory = base.memory;

    //Check for destroyed creeps
    for (let role in baseMemory.roles) {
        var creepNames = baseMemory.roles[role].creeps;
        for (let i = 0; i < creepNames.length; i++) {
            var name = creepNames[i];
            if (Game.creeps[name] === undefined) {
                var creepMemory = Memory.creeps[name];
                if (creepMemory) {
                    for (let key in creepMemory.parts)
                        baseMemory.roles[creepMemory.role].parts[key] -= creepMemory.parts[key];

                    var manager = Game.creepManagers[creepMemory.role];
                    if (manager)
                        manager.onDestroy(name, creepMemory);

                    delete Memory.creeps[name];
                }
                listUtils.removeAt(creepNames, i);
                i--;
                console.log(base.name + ": Lost " + role + " (" + creepNames.length  + " left)");
            }
        }
    }
}