"use strict";
var partUtils = require('util.parts');

const CORE_PARTS = [MOVE, CLAIM]; //650
const REPEAT_PARTS = [];

module.exports.getBodyInfo = function(energy) {
    return partUtils.get(CORE_PARTS, REPEAT_PARTS, energy);
}

module.exports.onCreate = function(name, memory) {
    var flagName = memory.flag;
    var flagMemory = Memory.flags[flagName];
    if (flagMemory)
        flagMemory.claimer = this;
}

module.exports.onDestroy = function(name, memory) {
    var flagName = memory.flag;
    var flagMemory = Memory.flags[flagName];
    if (flagMemory)
        delete flagMemory.claimer;
}

module.exports.update = function(creep, memory, actions) {
    if (memory.room && creep.pos.roomName !== memory.room) {
        var pos = creep.pos.findClosestByPath(creep.room.findExitTo(memory.room));
        if (pos)
            actions.moveTo(creep, pos, true);
        return;
    }
    var controller = creep.room.controller;
    if (controller) {
        if (actions.claim(creep, controller, true))
            return;
    }
}