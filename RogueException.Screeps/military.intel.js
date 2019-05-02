"use strict";
var listUtils = require("util.list");
var partUtils = require("util.parts");
var memoryUtils = require("util.memory");
var requestUtils = require("util.requests");
var scanner = require("util.scanner");

module.exports.updateGlobal = function(actions) {
    for (let roomName in Game.rooms) {
        var roomMemory = Memory.rooms[roomName];
        if (!roomMemory) {
            roomMemory = memoryUtils.createRoom();
            Memory.rooms[roomName] = roomMemory;
        }
        
        var room = Game.rooms[roomName];
        if (room) {
            var threatLevel = 0;
            var defenseLevel = 0;
            var staticDefenseLevel = 0;
            var creeps = room.find(FIND_CREEPS, { filter: x => !x.spawning });
            var myStructures = room.find(FIND_MY_STRUCTURES);
            var hostileStructures = room.find(FIND_HOSTILE_STRUCTURES);
            var hostiles = [];
            var hostileTowers = [];
            var units = [];
            var towers = [];
            var controller = room.controller;
            
            if (!roomMemory.scanned || roomMemory.rescanTime <= Game.time)
                scanner.scanRoom(room);
                
            if (controller) {
                if (controller.owner)
                    roomMemory.owner = controller.owner.username;
                else if (controller.reservation) {
                    roomMemory.owner = controller.reservation.username;
                    roomMemory.rescanTime = Game.time + controller.reservation.ticksToEnd;
                }
            }
            
            for (let j = 0; j < creeps.length; j++) {
                var creep = creeps[j];
                var memory = creep.memory;
                var totalPower = partUtils.getPowerLevel(creep);
                
                if (creep.my) {
                    if (memory.military === true)
                        listUtils.add(units, creep.name);
                }
                else
                    listUtils.add(hostiles, creep.id);
                                    
                if (creep.my) {
                    if (memory.room === roomName)
                        defenseLevel += totalPower;
                }
                else {
                    if (totalPower === 0)
                        threatLevel += 1;
                    else
                        threatLevel += totalPower;
                }
            }

            for (let j = 0; j < myStructures.length; j++) {
                var structure = myStructures[j];
                var type = structure.structureType; 
                if (type === STRUCTURE_TOWER) {          
                    listUtils.add(towers, structure.id);    
                    staticDefenseLevel += 5000;
                }
            }

            for (let j = 0; j < hostileStructures.length; j++) {
                var structure = hostileStructures[j];
                var type = structure.structureType; 
                if (type === STRUCTURE_TOWER) {          
                    listUtils.add(hostiles, structure.id);    
                    threatLevel += 5000;
                }
                else if (type !== STRUCTURE_CONTROLLER &&
                        type !== STRUCTURE_RAMPART) {
                    threatLevel += 1;
                    listUtils.add(hostiles, structure.id);
                }
            }

            roomMemory.staticDefenseLevel = staticDefenseLevel;
            roomMemory.defenseLevel = defenseLevel;
            roomMemory.threatLevel = threatLevel;
            roomMemory.hostiles = hostiles;
            //roomMemory.hostileTowers = hostileTowers;
            roomMemory.units = units;
            roomMemory.towers = towers;
        }
        else {
            roomMemory.staticDefenseLevel = 0;
            roomMemory.defenseLevel = 0;
            //roomMemory.threatLevel = 0;
            roomMemory.hostiles = [];
            //roomMemory.hostileTowers = [];
            roomMemory.units = [];
            roomMemory.towers = [];
        }
    }
}

module.exports.updateBase = function(base, actions, creepRequests, structureRequests, defenseRequests) {
    var baseMemory = base.memory;
    var threatRooms = [];
    var melee = Memory.military.roles.melee;
    var ranged = Memory.military.roles.ranged;
    var healer = Memory.military.roles.healer;
    var military = melee.creeps.concat(ranged.creeps).concat(healer.creeps);

    var totalThreatLevel = 0;
    var totalDefenseLevel = 0;
    for (let i = 0; i < military.length; i++) {
        var creep = Game.creeps[military[i]];
        if (listUtils.contains(baseMemory.rooms, creep.pos.roomName))
            totalDefenseLevel += partUtils.getPowerLevel(creep);
    }
    for (let i = 0; i < baseMemory.rooms.length; i++)
        totalThreatLevel += Memory.rooms[baseMemory.rooms[i]].threatLevel;
    baseMemory.threatLevel = totalThreatLevel;
    baseMemory.defenseLevel = totalDefenseLevel;
}
