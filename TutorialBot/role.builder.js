var actionHarvest = require('action.harvest');
var actionBuild = require('action.build');

var roleBuilder = {

    /** @param {Creep} creep **/
    run: function(creep) {

	    if(creep.memory.building && creep.carry.energy == 0) {
            creep.memory.building = false;
            creep.say('harvesting');
	    }
	    if(!creep.memory.building && creep.carry.energy == creep.carryCapacity) {
	        creep.memory.building = true;
	        creep.say('building');
	    }

	    if(creep.memory.building) {
			// Build
	        if (!actionBuild.build(creep)) {
				// If cannot build, get out of the way
				var targets = creep.room.find(FIND_MY_SPAWNS);
                if(creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(targets[0], {visualizePathStyle: {stroke: '#ffffff'}});
                }
			}
	    }
	    else {
	        actionHarvest.harvest(creep);
	    }
	}
};

module.exports = roleBuilder;