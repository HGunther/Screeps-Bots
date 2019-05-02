var actionBuild = require('action.build');
var actionEnergize = require('action.energize');
var actionHarvest = require('action.harvest');
var actionUpgrade = require('action.upgrade');

var roleHarvester = {

    /** @param {Creep} creep **/
    run: function (creep) {
        if (creep.carry.energy < creep.carryCapacity) {
            actionHarvest.harvest(creep);
            return;
        } else {
            if (actionEnergize.energize(creep)) {
                creep.say("Can't transfer");
                return;
            }
            //if primary objective cannot be completed, do something else
            if (actionBuild.build(creep)) {
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
        }
    }
};

module.exports = roleHarvester;