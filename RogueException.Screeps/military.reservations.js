"use strict";
var requestUtils = require("util.requests");

module.exports.updateGlobal = function(actions) {
}

module.exports.updateBase = function(base, actions, creepRequests, structureRequests, defenseRequests) {
    var baseMemory = base.memory;

    for (let i = 0; i < baseMemory.rooms.length; i++) {
        var roomName = baseMemory.rooms[i];
        var room = Game.rooms[roomName];
        var roomMemory = Memory.rooms[roomName];
        if (room && roomMemory && !roomMemory.reserver && roomMemory.threatLevel === 0) {
            var controller = room.controller;
            if (controller && !controller.owner) {// !controller.my) {
                var reservation = controller.reservation;
                if (!reservation ||
                        (reservation.username === "RogueException" || 
                        reservation.username === "Voltana" || 
                        reservation.username === "Shira") &&
                        reservation.ticksToEnd < 4500) {
                    var memory = {
                        military: true, 
                        special: true,
                        role: 'reserver', 
                        target: roomName 
                    };
                    requestUtils.add(creepRequests, 0.90, memory);
                }
            }
        }
    }
}