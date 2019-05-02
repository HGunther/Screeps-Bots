"use strict";
module.exports.updateTower = function(tower, actions) {
    //TODO: Use actions

    var hostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
    if(hostile) {
        tower.attack(hostile);
        return;
    }
    
    var creep = tower.pos.findClosestByRange(FIND_MY_CREEPS, { filter: (x) => {
        return x.hits < x.hitsMax;
    }});
    if(creep) {
        tower.heal(creep);
        return;
    }

    var structure = tower.pos.findClosestByRange(FIND_MY_STRUCTURES, { filter: (x) => {
        return x.structureType !== STRUCTURE_RAMPART && x.hits < x.hitsMax;
    }});
    if(structure) {
        tower.repair(structure);
        return;
    }

    var road = tower.pos.findClosestByRange(FIND_STRUCTURES, { filter: (x) => {
        return x.structureType == STRUCTURE_ROAD && x.hits < x.hitsMax;
    }});
    if(road) {
        tower.repair(road);
        return;
    }
    
    var structure = tower.pos.findClosestByRange(FIND_STRUCTURES, { filter: (x) => {
        return ((x.structureType === STRUCTURE_RAMPART && x.my) ||
                x.structureType === STRUCTURE_WALL) && 
                //x.hits < x.hitsMax &&
                x.hits < 25000;
    }});
    if(structure) {
        tower.repair(structure);
        return;
    }
}