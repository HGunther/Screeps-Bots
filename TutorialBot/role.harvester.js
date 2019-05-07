var actionBuild = require('action.build');
var actionEnergize = require('action.energize');
var actionHarvest = require('action.harvest');
var actionUpgrade = require('action.upgrade');
var actionRepair = require('action.repair');

var roleHarvester = {

    /** @param {Creep} creep **/
    run: function (creep) {
        if (creep.memory.energizing && creep.carry.energy == 0) {
			creep.memory.energizing = false;
			creep.say('harvesting');
		}
		if (!creep.memory.energizing && creep.carry.energy == creep.carryCapacity) {
			creep.memory.energizing = true;
			creep.say('energizing');
		}


        if (creep.memory.energizing) {
			// Energize
			if (actionEnergize.energize(creep)) {
				return;
			}
			creep.say("Can't energize");
			//if primary objective cannot be completed, do something else
			if (actionBuild.build(creep)) {
				return;
			}
			if (actionRepair.repair(creep)) {
				return;
			}
			if (actionUpgrade.upgrade(creep)) {
				return;
			}
			// just get out of the way
			var targets = creep.room.find(FIND_MY_SPAWNS);
			if (creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
				creep.moveTo(targets[0], {
					visualizePathStyle: {
						stroke: '#ffffff'
					}
				});
			}
		} else {
			actionHarvest.harvest(creep);
		}
    }
};

module.exports = roleHarvester;