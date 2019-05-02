"use strict";
var mapUtils = require("util.map");
var requestUtils = require("util.requests");

module.exports.updateGlobal = function(actions) {
}

module.exports.updateBase = function(base, actions, creepRequests, structureRequests, defenseRequests) {
    //Check for claim flags
    for (let flagName in Game.flags) {
        var flag = Game.flags[flagName];
        if (flag.color === COLOR_ORANGE) {
            var flagMemory = Memory.flags[flag.name];
            if (!flagMemory) {
                flagMemory = {};
                Memory.flags[flag.name] = flagMemory;
            }
            var roomName = flag.pos.roomName;
            var room = Game.rooms[roomName];
            if ((!room || (room.controller && !flag.room.controller.my)) && !flagMemory.claimer) {
                var memory = {
                    military: true,
                    special: true,
                    role: "claimer",
                    flag: flag.name,
                    room: roomName
                };
                requestUtils.add(creepRequests, 0.82, memory);
            }
            else if (!Game.bases[roomName]) {
                var roomMemory = Memory.rooms[roomName];
                if (roomMemory && roomMemory.scanned === true) {
                    var target = null;
                    for (let key in Game.constructionSites) {
                        var site = Game.constructionSites[key];
                        if (site.pos.roomName === roomName) {
                            target = site;
                            break;
                        }
                    }
                    if (target !== null) {
                        for (let i = 0; i < roomMemory.sources.length; i++) {
                            var sourceId = roomMemory.sources[i];
                            var sourceMemory = Memory.sources[sourceId];
                            if (sourceMemory) {
                                if (sourceMemory.harvesters.length < sourceMemory.maxHarvesters) {
                                    var memory = {
                                        military: true,
                                        special: true,
                                        role: "builder_remote",
                                        target: target.id,
                                        source: sourceId,
                                        room: roomName
                                    };
                                    requestUtils.add(creepRequests, 0.76, memory);
                                }
                            }
                        }
                    }
                }
            }
            else
                flag.remove();
        }
    }
}