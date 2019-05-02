"use strict";
var times, logNext = 0, lastCpu;
var currentSectionGroup, currentSection;
const logTimeTicks = 5;

// CPU Usage
module.exports.beginLoop = function() {
    if (logNext !== 0) {
        currentSection = null;
        times.init += Game.cpu.getUsed();
    }
}
module.exports.startGlobalSection = function() {
    if (logNext !== 0) {
        currentSectionGroup = times;
        currentSection = "global";
        lastCpu = Game.cpu.getUsed();
    }
}
module.exports.startBaseSection = function(base) {
    if (logNext !== 0) {
        currentSectionGroup = times.bases;
        currentSection = base.name;
        lastCpu = Game.cpu.getUsed();
    }
}
module.exports.startCreepSection = function(creep) {
    if (logNext !== 0) {
        currentSectionGroup = times.creeps;
        currentSection = creep.memory.role;
        lastCpu = Game.cpu.getUsed();
    }
}
module.exports.endSection = function() {
    if (logNext !== 0) {
        var cpu = Game.cpu.getUsed();
        if (!currentSectionGroup[currentSection])
            currentSectionGroup[currentSection] = cpu - lastCpu;
        else
            currentSectionGroup[currentSection] += cpu - lastCpu;
        lastCpu = cpu;
    }
}
module.exports.endLoop = function() {
    if (logNext !== 0) {
        times.total += Game.cpu.getUsed();
        logNext--;

        if (logNext === 0) {
            times.init = (times.init / logTimeTicks).toFixed(2);
            times.global = (times.global / logTimeTicks).toFixed(2);
            times.total = (times.total / logTimeTicks).toFixed(2);
            for (let name in times.bases)
                times.bases[name] = (times.bases[name] / logTimeTicks).toFixed(2);
            for (let name in times.creeps)
                times.creeps[name] = (times.creeps[name] / logTimeTicks).toFixed(2);
            console.log(JSON.stringify(times));
        }
    }
}
module.exports.logTimes = function() {
    logNext = logTimeTicks;
    times = { init: 0, global: 0, total: 0, bases: {}, creeps: {} };
    return "Calculating CPU usage...";
}
module.exports.isLoggingTimes = function() {
    return logNext !== 0;
}

// Actions
module.exports.showActions = function() {
    Memory.debug.enableSay = true;
    return "Actions are now shown";
}
module.exports.hideActions = function() {
    Memory.debug.enableSay = false;
    return "Actions are now hidden";
}
module.exports.sayAction = function(creep, action) {
    if (Memory.debug.enableSay)
        creep.say(action);
}

//Global Start/Stop
module.exports.start = function() {
    Memory.debug.run = true;
    return "Resumed main loop";
}
module.exports.stop = function() {
    Memory.debug.run = false;
    return "Stopped main loop";
}

//Respawn
module.exports.respawn = function(pass) {
    if (pass === "confirm") {
        for (let key in Memory)
            delete Memory[key];
        for (let name in Game.creeps)
            Game.creeps[name].suicide();
        for (let name in Game.structures) {
            var type = Game.structures[name].structureType;
            if (type !== STRUCTURE_SPAWN &&
                    type !== STRUCTURE_RAMPART)
                Game.structures[name].destroy();
        }
        for (let name in Game.constructionSites)
            Game.constructionSites[name].remove();
        for (let name in Game.rooms) {
            var roads = Game.rooms[name].find(FIND_STRUCTURES, { filter: x => x.structureType === STRUCTURE_ROAD });
            for (let i = 0; i < roads.length; i++)
                Game.getObjectById(roads[i].id).destroy();
        }
        return "Respawn successful";
    }
    else
        return "Are you sure?";
}

//Plans
module.exports.recheckPlan = function(name) {
    var baseMemory = Memory.bases[name];
    if (!baseMemory)
        return "Unknown base"
        
    //Reset every structure to queued
    for (let key in baseMemory.plan.built) {
        baseMemory.plan.queued[key] = baseMemory.plan.queued[key].concat(baseMemory.plan.built[key]);
        baseMemory.plan.built[key] = [];
    }

    return "Recheck started";
}
module.exports.reclaimRoom = function(baseName, roomName) {
    var baseMemory = Memory.bases[baseName];
    if (!baseMemory)
        return "Unknown base"
    var room = Game.rooms[roomName];
    if (!room)
        return "Unknown room"

    Game.baseManager.reclaimRoom(baseMemory, room);
    return "Reclaim successful";
}

//Temporary
/*module.exports.reAddWalls = function(baseName) {
    var baseMemory = Memory.bases[baseName];
    var walls = [], ramparts = [];
    var currentWalls = Game.rooms[baseName].find(FIND_STRUCTURES, { filter: x => x.structureType === STRUCTURE_WALL });
    var currentRamparts = Game.rooms[baseName].find(FIND_STRUCTURES, { filter: x => x.structureType === STRUCTURE_RAMPART });

    var mapUtils = require('util.map');
    for (let i = 0; i < currentWalls.length; i++)
        walls.push(mapUtils.serializePos(currentWalls[i].pos));
    for (let i = 0; i < currentRamparts.length; i++)
        ramparts.push(mapUtils.serializePos(currentRamparts[i].pos));

    baseMemory.plan.built[STRUCTURE_WALL] = walls;
    baseMemory.plan.built[STRUCTURE_RAMPART] = ramparts;
    baseMemory.plan.queued[STRUCTURE_WALL] = [];
    baseMemory.plan.queued[STRUCTURE_RAMPART] = [];
}
module.exports.convertPlan = function(name) {
    var baseMemory = Memory.bases[name];
    if (!baseMemory)
        return "Unknown base"

    var mapUtils = require('util.map');
    var queued = baseMemory.plan.queued;
    var built = baseMemory.plan.built;
    for (let structureType in queued) {
        if (structureType !== STRUCTURE_ROAD) {
            var s1 = queued[structureType];
            for (let i = 0; i < s1.length; i++)
                s1[i] = mapUtils.serializePos(mapUtils.deserializePos(s1[i]));
            var s2 = built[structureType];
            for (let i = 0; i < s2.length; i++)
                s2[i] = mapUtils.serializePos(mapUtils.deserializePos(s2[i]));
        }
        else {
            var s1 = queued[structureType];
            for (let i = 0; i < s1.length; i++) {
                var road = s1[i];
                for (let i2 = 0; i2 < road.length; i2++)
                    road[i2] = mapUtils.serializePos(mapUtils.deserializePos(road[i2]));
            }
            var s2 = built[structureType];
            for (let i = 0; i < s2.length; i++) {
                var road = s2[i];
                for (let i2 = 0; i2 < road.length; i2++)
                    road[i2] = mapUtils.serializePos(mapUtils.deserializePos(road[i2]));
            }
        }
    }
}*/
module.exports.recalcParts = function(name) {
    var baseMemory = Memory.bases[name];
    if (!baseMemory)
        return "Unknown base"

    for (let role in baseMemory.roles) {
        var parts = {
            move: 0,
            work: 0,
            carry: 0,
            attack: 0,
            ranged_attack: 0,
            tough: 0,
            heal: 0,
            claim: 0
        }
        var creeps = baseMemory.roles[role].creeps;
        for (let i = 0; i < creeps.length; i++) {
            var creepName = creeps[i];
            var creepMemory = Memory.creeps[creepName];
            var creep = Game.creeps[creepName];
            if (creep) {
                var body = Game.creeps[creepName].body;
                for (let j = 0; j < body.length; j++)
                    parts[body[j].type]++;
            }
        }
        baseMemory.roles[role].parts = parts;
    }
    return "Done";
}