"use strict";
var listUtils = require('util.list');
var mapUtils = require('util.map');
var partUtils = require('util.parts');

const CORE_PARTS = [TOUGH,MOVE,MOVE,RANGED_ATTACK];
const REPEAT_PARTS = [TOUGH,MOVE,RANGED_ATTACK];

module.exports.getBodyInfo = function(energy) {
    return partUtils.get(CORE_PARTS, REPEAT_PARTS, energy);
}

module.exports.onCreate = function(name, memory) {
    if (memory.squad)
        listUtils.add(Memory.military.squads[memory.squad].creeps, name);
}

module.exports.onDestroy = function(name, memory) {
    if (memory.squad)
        listUtils.remove(Memory.military.squads[memory.squad].creeps, name);
}

module.exports.update = function(creep, memory, actions) {
    if (memory.room && creep.pos.roomName !== memory.room) {
        var pos = creep.pos.findClosestByPath(creep.room.findExitTo(memory.room));
        if (pos)
            actions.moveTo(creep, pos, true);
        return;
    }

    var roomMemory = Memory.rooms[memory.room];
    if (roomMemory) {
        var hostile = mapUtils.findClosestHostileByPath(creep.pos, roomMemory.hostiles);
        if (hostile) {
            var pos = hostile.pos;
            if (actions.rangedAttack(creep, hostile, true))
                return;
            if (creep.pos.isNearTo(pos))
                actions.flee(creep, pos, 2);
            return;
        }
    }
    
    roomMemory = Memory.rooms[creep.pos.roomName];
    if (roomMemory && roomMemory.rallyPos)
        actions.moveTo(creep, mapUtils.deserializePos(roomMemory.rallyPos));
}