"use strict";
var listUtils = require('util.list');
var memoryUtils = require('util.memory');
var partUtils = require('util.parts');

const CORE_PARTS = [MOVE];
const REPEAT_PARTS = [];

module.exports.getBodyInfo = function(energy) {
    return partUtils.get(CORE_PARTS, REPEAT_PARTS, energy);
}

module.exports.onCreate = function(name, memory) {
    var roomMemory = Memory.rooms[memory.target];
    if (!roomMemory) {
        roomMemory = memoryUtils.createRoom();
        Memory.rooms[memory.target] = roomMemory;
    }
    roomMemory.scout = name;
}

module.exports.onDestroy = function(name, memory) {
    delete Memory.rooms[memory.target].scout;
}

module.exports.update = function(creep, memory, actions) {
    var roomMemory = Memory.rooms[memory.target];
    var baseMemory = Memory.bases[memory.base];
    if (!roomMemory.scanned || roomMemory.rescanTime <= Game.time) {
        if (creep.pos.roomName !== memory.target) {
            var pos = creep.pos.findClosestByPath(creep.room.findExitTo(memory.target));
            if (pos) {
                if (actions.moveTo(creep, pos, true))
                    return;
            }
        }
    }
    else if (listUtils.contains(baseMemory.rooms, memory.target)) { //Is it claimed yet?
        var spawn = Game.spawns[baseMemory.spawns[0]];
        if (spawn) {
            actions.recycle(creep, spawn, true);
            return;
        }
    }
}