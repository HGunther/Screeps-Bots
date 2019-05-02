"use strict";
var listUtils = require('util.list');
var mapUtils = require("util.map");
const maxControllerLevel = 8;

module.exports.addCoreRoom = function(base, room, roomMemory) {
    var baseMemory = base.memory;
    var controller = room.controller;
    var coreSpawn = Game.spawns[baseMemory.spawns[0]];
    var roadCosts = {};
    roadCosts[room.name] = new PathFinder.CostMatrix();
    var structureSpots = {};

    //Set spawns as impassable
    for (let i = 0; i < baseMemory.spawns.length; i++)
        setImpassable(roadCosts, Game.spawns[baseMemory.spawns[i]].pos);
    //Set source container as impassable
    for (let i = 0; i < baseMemory.sources.length; i++) {
        var pos = Memory.sources[baseMemory.sources[i]].container.pos;
        if (pos)
            setImpassable(roadCosts, mapUtils.deserializePos(pos));
    }
    //Set mineral container as impassable
    for (let i = 0; i < baseMemory.minerals.length; i++) {
        var pos = Memory.minerals[baseMemory.minerals[i]].container.pos;
        if (pos)
            setImpassable(roadCosts, mapUtils.deserializePos(pos));
    }
    
    //Plan walls/ramparts        
    var walls = [];
    var ramparts = [];
    planTopWalls(walls, ramparts, room, roadCosts);
    planRightWalls(walls, ramparts, room, roadCosts);
    planBottomWalls(walls, ramparts, room, roadCosts);
    planLeftWalls(walls, ramparts, room, roadCosts);

    //Plan roads
    var roads = [];
    //Local Sources <-> Spawn
    for (let i = 0; i < roomMemory.sources.length; i++) {
        var source = Game.getObjectById(roomMemory.sources[i]);
        planRoadsBetween(roads, coreSpawn, source, roadCosts);
    }
    //Controller <-> Spawn
    planRoadsBetween(roads, coreSpawn, controller, roadCosts);
    //Local Minerals <-> Spawn
    for (let i = 0; i < roomMemory.minerals.length; i++) {
        var mineral = Game.getObjectById(roomMemory.minerals[i]);
        planRoadsBetween(roads, coreSpawn, mineral, roadCosts);
    }

    //Dont build on roads
    for (let i = 0; i < roads.length; i++) { 
        var road = roads[i];   
        for (let j = 0; j < road.length; j++)
            setBadPos(structureSpots, mapUtils.deserializePos(road[j]));
    }
    
    //Dont build near spawns
    var pos = mapUtils.findSpacesAround(coreSpawn.pos);
    for (let j = 0; j < pos.length; j++)
        setBadPos(structureSpots, pos[j]);

    //Dont build near sources
    for (let i = 0; i < baseMemory.sources.length; i++) {
        var pos = mapUtils.findSpacesAround(mapUtils.deserializePos(Memory.sources[baseMemory.sources[i]].pos));
        for (let j = 0; j < pos.length; j++)
            setBadPos(structureSpots, pos[j]);
    }

    //Dont build near minerals
    for (let i = 0; i < baseMemory.minerals.length; i++) {
        var pos = mapUtils.findSpacesAround(mapUtils.deserializePos(Memory.minerals[baseMemory.minerals[i]].pos));
        for (let j = 0; j < pos.length; j++)
            setBadPos(structureSpots, pos[j]);
    }

    //Add storage
    var storages = [];
    var maxStorages = CONTROLLER_STRUCTURES[STRUCTURE_STORAGE][maxControllerLevel];
    for (let i = 0; i < maxStorages; i++) {
        var pos = getBuildPosition(room, coreSpawn.pos, 2, 5, roadCosts, structureSpots);
        if (pos) {
            listUtils.add(storages, mapUtils.serializePos(pos));
            var aroundPos = mapUtils.findSpacesAround(pos);
            for (let j = 0; j < aroundPos.length; j++)
                setBadPos(structureSpots, aroundPos[j]);
            planRoadsBetween(roads, coreSpawn, pos, roadCosts);
        }
    }
    
    //Add terminal
    var terminals = [];
    var maxTerminals = CONTROLLER_STRUCTURES[STRUCTURE_TERMINAL][maxControllerLevel];
    for (let i = 0; i < maxTerminals; i++) {
        var pos = getBuildPosition(room, coreSpawn.pos, 2, 5, roadCosts, structureSpots);
        if (pos) {
            listUtils.add(terminals, mapUtils.serializePos(pos));
            var aroundPos = mapUtils.findSpacesAround(pos);
            for (let j = 0; j < aroundPos.length; j++)
                setBadPos(structureSpots, aroundPos[j]);
            planRoadsBetween(roads, coreSpawn, pos, roadCosts);
        }
    }

    //Add extensions
    var extensions = [];
    var maxExtensions = CONTROLLER_STRUCTURES[STRUCTURE_EXTENSION][maxControllerLevel];
    for (let i = 0; i < maxExtensions; i++) {
        var pos = getBuildPosition(room, coreSpawn.pos, 2, 25, roadCosts, structureSpots);
        if (pos) {
            listUtils.add(extensions, mapUtils.serializePos(pos));
            var aroundPos = mapUtils.findCardinalSpacesAround(pos);
            for (let j = 0; j < aroundPos.length; j++)
                setBadPos(structureSpots, aroundPos[j]);
            planRoadsBetween(roads, coreSpawn, pos, roadCosts);
        }
    }

    //Add towers
    var towers = [];
    var maxTowers = CONTROLLER_STRUCTURES[STRUCTURE_TOWER][maxControllerLevel];
    for (let i = 0; i < maxTowers; i++) {
        var pos = getBuildPosition(room, coreSpawn.pos, 6, 25, roadCosts, structureSpots);
        if (pos) {
            listUtils.add(towers, mapUtils.serializePos(pos));
            var aroundPos = mapUtils.findSpacesAround(pos);
            for (let j = 0; j < aroundPos.length; j++)
                setBadPos(structureSpots, aroundPos[j]);
            planRoadsBetween(roads, coreSpawn, pos, roadCosts);
        }
    }

    var result = {};
    result[STRUCTURE_EXTENSION] = extensions;
    result[STRUCTURE_ROAD] = roads;
    result[STRUCTURE_TOWER] = towers;
    result[STRUCTURE_STORAGE] = storages;
    result[STRUCTURE_TERMINAL] = terminals;
    result[STRUCTURE_WALL] = walls;
    result[STRUCTURE_RAMPART] = ramparts;
    return result;
}

module.exports.addExtensionRoom = function(base, room, roomMemory) {
    var baseMemory = base.memory;
    var controller = room.controller;
    var coreRoom = Game.rooms[base.name];
    var coreSpawn = Game.spawns[baseMemory.spawns[0]];
    var structureSpots = {};
    var roadCosts = calculateRoadCosts(baseMemory, roadCosts);

    //Set source container as impassable
    for (let i = 0; i < baseMemory.sources.length; i++) {
        var pos = Memory.sources[baseMemory.sources[i]].container.pos;
        if (pos)
            setImpassable(roadCosts, mapUtils.deserializePos(pos));
    }
    //Set mineral container as impassable
    for (let i = 0; i < baseMemory.minerals.length; i++) {
        var pos = Memory.minerals[baseMemory.minerals[i]].container.pos;
        if (pos)
            setImpassable(roadCosts, mapUtils.deserializePos(pos));
    }

    //Plan roads
    var roads = [];
    //Remote Sources <-> Spawn
    for (let i = 0; i < roomMemory.sources.length; i++) {
        if (Memory.sources[roomMemory.sources[i]].owner === base.name) {
            var source = Game.getObjectById(roomMemory.sources[i]);
            planRoadsBetween(roads, coreSpawn, source, roadCosts);
        }
    }
    //Controller <-> Spawn
    if (controller)
        planRoadsBetween(roads, coreSpawn, controller, roadCosts);

    //Dont build on roads
    for (let i = 0; i < roads.length; i++) { 
        var road = roads[i];   
        for (let j = 0; j < road.length; j++)
            setBadPos(structureSpots, mapUtils.deserializePos(road[j]));
    }
    
    //Dont build near sources
    for (let i = 0; i < baseMemory.sources.length; i++) {
        var aroundPos = mapUtils.findSpacesAround(mapUtils.deserializePos(Memory.sources[baseMemory.sources[i]].pos));
        for (let j = 0; j < aroundPos.length; j++)
            setBadPos(structureSpots, aroundPos[j]);
    }

    //Dont build near minerals
    for (let i = 0; i < baseMemory.minerals.length; i++) {
        var aroundPos = mapUtils.findSpacesAround(mapUtils.deserializePos(Memory.minerals[baseMemory.minerals[i]].pos));
        for (let j = 0; j < aroundPos.length; j++)
            setBadPos(structureSpots, aroundPos[j]);
    }

    var result = {};
    result[STRUCTURE_EXTENSION] = [];
    result[STRUCTURE_ROAD] = roads;
    result[STRUCTURE_TOWER] = [];
    result[STRUCTURE_STORAGE] = [];
    result[STRUCTURE_TERMINAL] = [];
    result[STRUCTURE_WALL] = [];
    result[STRUCTURE_RAMPART] = [];
    return result;
}

function planRoadsBetween(roads, start, end, roadCosts) {
    if (start.pos)
        start = start.pos;
    if (end.pos)
        end = end.pos;
    var path = PathFinder.search(start, { 
        pos: end, 
        range: 1 
    }, { 
        roomCallback: x => getRoomCosts(roadCosts, x),
        plainCost: 2, 
        swampCost: 2
    });
    if (!path.incomplete) {
        for (let i = 0; i < path.path.length; i++)
            setRoad(roadCosts, path.path[i]);
        listUtils.add(roads, mapUtils.serializePath(path.path));
    }
}

function planTopWalls(walls, ramparts, room, roadCosts) {
    var terrain = room.lookForAtArea(LOOK_TERRAIN, 0, 0, 0, 49, true);
    for (let start = 0; start < 50; start++) {
        if (terrain[start].terrain !== 'wall') {
            start--;
            var end = start + 1;
            for (; end < 50; end++) {
                if (terrain[end].terrain === 'wall') {
                    planWall(walls, room, start - 1, 1, roadCosts);
                    planWall(walls, room, start - 1, 2, roadCosts);
                    planWall(walls, room, end + 1, 1, roadCosts);
                    planWall(walls, room, end + 1, 2, roadCosts);
                    for (let i = start; i <= end; i++) {
                        var mod = (i - start) % 4;
                        if (mod === 0 || mod === 1)
                            planWall(ramparts, room, i, 2);
                        else
                            planWall(walls, room, i, 2, roadCosts);
                    }
                    break;
                }                
            }
            start = end;
        }
    }
}
function planBottomWalls(walls, ramparts, room, roadCosts) {
    var terrain = room.lookForAtArea(LOOK_TERRAIN, 49, 0, 49, 49, true);
    for (let start = 0; start < 50; start++) {
        if (terrain[start].terrain !== 'wall') {
            start--;
            var end = start + 1;
            for (; end < 50; end++) {
                if (terrain[end].terrain === 'wall') {
                    planWall(walls, room, start - 1, 48, roadCosts);
                    planWall(walls, room, start - 1, 47, roadCosts);
                    planWall(walls, room, end + 1, 48, roadCosts);
                    planWall(walls, room, end + 1, 47, roadCosts);
                    for (let i = start; i <= end; i++) {
                        var mod = (i - start) % 4;
                        if (mod === 0 || mod === 1)
                            planWall(ramparts, room, i, 47);
                        else
                            planWall(walls, room, i, 47, roadCosts);
                    }
                    break;
                }                
            }
            start = end;
        }
    }    
}
function planLeftWalls(walls, ramparts, room, roadCosts) {
    var terrain = room.lookForAtArea(LOOK_TERRAIN, 0, 0, 49, 0, true);
    for (let start = 0; start < 50; start++) {
        if (terrain[start].terrain !== 'wall') {
            start--;
            var end = start + 1;
            for (; end < 50; end++) {
                if (terrain[end].terrain === 'wall') {
                    planWall(walls, room, 1, start - 1, roadCosts);
                    planWall(walls, room, 2, start - 1, roadCosts);
                    planWall(walls, room, 1, end + 1, roadCosts);
                    planWall(walls, room, 2, end + 1, roadCosts);
                    for (let i = start; i <= end; i++) {
                        var mod = (i - start) % 4;
                        if (mod === 0 || mod === 1)
                            planWall(ramparts, room, 2, i);
                        else
                            planWall(walls, room, 2, i, roadCosts);
                    }
                    break;
                }                
            }
            start = end;
        }
    }
}
function planRightWalls(walls, ramparts, room, roadCosts) {
    var terrain = room.lookForAtArea(LOOK_TERRAIN, 0, 49, 49, 49, true);
    for (let start = 0; start < 50; start++) {
        if (terrain[start].terrain !== 'wall') {
            start--;
            var end = start + 1;
            for (; end < 50; end++) {
                if (terrain[end].terrain === 'wall') {
                    planWall(walls, room, 48, start - 1, roadCosts);
                    planWall(walls, room, 47, start - 1, roadCosts);
                    planWall(walls, room, 48, end + 1, roadCosts);
                    planWall(walls, room, 47, end + 1, roadCosts);
                    for (let i = start; i <= end; i++) {
                        var mod = (i - start) % 4;
                        if (mod === 0 || mod === 1)
                            planWall(ramparts, room, 47, i);
                        else
                            planWall(walls, room, 47, i, roadCosts);
                    }
                    break;
                }                
            }
            start = end;
        }
    }    
}
function planWall(walls, room, x, y, roadCosts) {
    if (room.lookForAt(LOOK_TERRAIN, x, y)[0] !== 'wall') {
        var pos = new RoomPosition(x, y, room.name);
        listUtils.add(walls, mapUtils.serializePos(pos));
        if (roadCosts !== undefined) //Is not a rampart
            setImpassable(roadCosts, pos);
    }
}

function getRoomCosts(roadCosts, roomName) {
    var costs = roadCosts[roomName];
    if (!costs) {
        costs = new PathFinder.CostMatrix();
        roadCosts[roomName] = costs;
    }
    return costs;
}
function setRoad(roadCosts, pos) {
    var costs = getRoomCosts(roadCosts, pos.roomName);
    costs.set(pos.x, pos.y, 1);
}
function setImpassable(roadCosts, pos) {
    var costs = getRoomCosts(roadCosts, pos.roomName);
    costs.set(pos.x, pos.y, 255);
}
function setBadPos(structurePos, pos) {
    if (_.isArray(pos))
        structurePos[pos[0] * 100 + pos[1]] = true;
    else
        structurePos[pos.x * 100 + pos.y] = true;
}

function calculateRoadCosts(baseMemory) {
    var roadCosts = {};
    calculatePlanRoadCost(baseMemory, roadCosts, baseMemory.plan.queued);
    calculatePlanRoadCost(baseMemory, roadCosts, baseMemory.plan.built);
    return roadCosts;
}
function calculatePlanRoadCost(baseMemory, roadCosts, plan) {
    for (let structureType in plan) {
        if (structureType === STRUCTURE_ROAD) {
            var roads = plan[STRUCTURE_ROAD]
            for (let i = 0; i < roads.length; i++) {
                var road = roads[i];
                for (let j = 0; j < road.length; j++) {
                    var pos = mapUtils.deserializePos(road[j]);
                    var costs = getRoomCosts(roadCosts, pos.roomName);
                    costs.set(pos.x, pos.y, 1);
                }
            }
        }
        else {
            if (structureType !== STRUCTURE_RAMPART) {
                var structures = plan[structureType];
                for (let i = 0; i < structures.length; i++) {
                    var pos = mapUtils.deserializePos(structures[i]);
                    var costs = getRoomCosts(roadCosts, pos.roomName);
                    costs.set(pos.x, pos.y, 255);
                }
            }
        }
    }
}

function getBuildPosition(room, center, minRadius, maxRadius, roadCosts, structurePos) {
    var costs = getRoomCosts(roadCosts, room.name);
    for (let max = minRadius; max <= maxRadius; max++) {
        var radius = max - minRadius;
        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 25; j++) {
                var angle = Math.random() * Math.PI * 2;
                var distance = Math.random() * radius + minRadius;
                var xOffset = Math.round(Math.cos(angle) * distance);
                var yOffset = Math.round(Math.sin(angle) * distance);

                var x = Math.round(center.x + xOffset);
                var y = Math.round(center.y + yOffset);

                if (x > 5 && y > 5 && x < 44 && y < 44) {
                    var cost = costs.get(x, y);
                    if (cost !== 1 && cost !== 255 && structurePos[x * 100 + y] !== true) {
                        var results = room.lookAt(x, y);
                        var valid = true;
                        for (let k = 0; k < results.length; k++) {
                            var result = results[k];
                            if (result.type !== LOOK_TERRAIN || result.terrain === 'wall') {
                                valid = false;
                                break;
                            }
                        }
                        if (valid) {
                            var pos = new RoomPosition(x, y, room.name);
                            setBadPos(structurePos, pos);
                            setImpassable(roadCosts, pos);
                            return pos;
                        }
                    }
                }
            }
        }
    }
    return undefined;
}