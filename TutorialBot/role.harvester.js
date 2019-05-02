var actionBuild = require('action.build');
var actionEnergize = require('action.energize');
var actionHarvest = require('action.harvest');
var actionUpgrade = require('action.upgrade');

var roleHarvester = {

    /** @param {Creep} creep **/
    run: function(creep) {
	    if(creep.carry.energy < creep.carryCapacity) {
            actionHarvest.harvest(creep);
        }
        else {
            var result = actionEnergize.energize(creep);
            if(!result) {
                // do something else
                if(!actionBuild.build(creep)){
                    if(!actionUpgrade.upgrade(creep)){
                        // just get out of the way
                        var targets = creep.room.find(FIND_MY_SPAWNS);
                        if(creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(targets[0], {visualizePathStyle: {stroke: '#ffffff'}});
                        }
                    }
                }
            }
        }
	}
};

module.exports = roleHarvester;