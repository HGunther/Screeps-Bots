"use strict";
var listUtils = require("util.list");
var mapUtils = require("util.map");
var requestUtils = require("util.requests");
var planner = require("util.planner");

module.exports.updateGlobal = function(actions) {
}

module.exports.updateBase = function(base, actions, creepRequests, structureRequests, defenseRequests) {
    var baseMemory = base.memory;
    
    //If we haven't claimed our base room yet, do it now
    if (!listUtils.contains(baseMemory.rooms, base.name))
        claimRoom(base, Game.rooms[base.name]);

    var exits = Game.map.describeExits(base.name);
    for (let dir in exits) {
        var roomName = exits[dir];
        if (Game.map.isRoomAvailable(roomName)) {
            var roomMemory = Memory.rooms[roomName];

            if (roomMemory && !listUtils.contains(baseMemory.rooms, roomName)) {
                var room = Game.rooms[roomName];
                if (roomMemory.controller && !roomMemory.owner) {
                    if (room)
                        claimRoom(base, room);
                    else
                        roomMemory.rescanTime = Game.time; //Force a rescan
                }            
            }

            if (!roomMemory || ((!roomMemory.scanned || roomMemory.rescanTime <= Game.time) && !roomMemory.scout)) {
                var memory = {
                    military: true, 
                    special: true,
                    role: 'scout', 
                    target: roomName 
                };
                requestUtils.add(creepRequests, 0.90, memory);
            }
        }
    }
}

function claimRoom(base, room) {
    var baseMemory = base.memory;
    var roomMemory = Memory.rooms[room.name];
    var spawn = Game.spawns[baseMemory.spawns[0]];
    var isCore = room.name === base.name;

    //Add room
    listUtils.add(baseMemory.rooms, room.name);
    
    //Claim sources/minerals
    for (let i = 0; i < roomMemory.sources.length; i++) {
        var id = roomMemory.sources[i];
        var sourceMemory = Memory.sources[id];

        var distance = mapUtils.getPathDistanceTo(spawn.pos, mapUtils.deserializePos(sourceMemory.pos));
        if (!sourceMemory.owner || distance < sourceMemory.distance) {
            if (sourceMemory.owner)
                listUtils.remove(Memory.bases[sourceMemory.owner].sources, id);
            sourceMemory.owner = base.name;
            sourceMemory.distance = distance;
            listUtils.add(baseMemory.sources, id);
        }
    }
    if (isCore === true) {
        for (let i = 0; i < roomMemory.minerals.length; i++) {
            var id = roomMemory.minerals[i];
            var mineralMemory = Memory.minerals[id];

            var distance = mapUtils.getPathDistanceTo(spawn.pos, mapUtils.deserializePos(mineralMemory.pos));
            if (!mineralMemory.owner || distance < mineralMemory.distance) {
                if (mineralMemory.owner)
                    listUtils.remove(Memory.bases[mineralMemory.owner].minerals, id);
                mineralMemory.owner = base.name;
                mineralMemory.distance = distance;
                listUtils.add(baseMemory.minerals, id);
            }
        }
    }

    //Sort by distance
    baseMemory.sources = _.sortBy(baseMemory.sources, x => Memory.sources[x].distance);
    baseMemory.minerals = _.sortBy(baseMemory.minerals, x => Memory.minerals[x].distance);

    //Plan room
    if (isCore === true) {
        baseMemory.plan.queued = planner.addCoreRoom(base, room, roomMemory);
        for (let key in baseMemory.plan.queued)
            baseMemory.plan.built[key] = [];
    }
    else {
        var plan = planner.addExtensionRoom(base, room, roomMemory);
        for (let key in plan)
            baseMemory.plan.queued[key] = baseMemory.plan.queued[key].concat(plan[key]);
    }

    console.log(base.name + ": Claimed room " + room.name);
}

function unclaimRoom(base, room) {
    var baseMemory = base.memory;
    var roomMemory = Memory.rooms[room.name];
    var spawn = Game.spawns[baseMemory.spawns[0]];

    //Remove room
    listUtils.remove(baseMemory.rooms, room.name);
    
    //Unclaim sources/minerals
    for (let i = 0; i < roomMemory.sources.length; i++) {
        var id = roomMemory.sources[i];
        var sourceMemory = Memory.sources[id];

        if (sourceMemory.owner === base.name) {
            listUtils.remove(baseMemory.sources, id);
            sourceMemory.owner = null;
            sourceMemory.distance = 0;
        }
    }
    for (let i = 0; i < roomMemory.minerals.length; i++) {
        var id = roomMemory.minerals[i];
        var mineralMemory = Memory.minerals[id];

        if (mineralMemory.owner === base.name) {
            listUtils.remove(baseMemory.minerals, id);
            sourceMemory.owner = null;
            sourceMemory.distance = 0;
        }
    }

    //Unplan room

    console.log(base.name + ": Unclaimed room " + room.name);
}