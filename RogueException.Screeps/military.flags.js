"use strict";

module.exports.updateGlobal = function(actions) {
}

module.exports.updateBase = function(base, actions, creepRequests, structureRequests, defenseRequests) {
    //Delete destroyed flags
    for (let flag in Memory.flags) {
        if (!Game.flags[flag])
            delete Memory.flags[flag];
    }
}
