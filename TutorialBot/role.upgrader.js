var actionBuild = require('action.build');
var actionEnergize = require('action.energize');
var actionHarvest = require('action.harvest');
var actionUpgrade = require('action.upgrade');

var roleUpgrader = {

    /** @param {Creep} creep **/
    run: function (creep) {

        if (creep.memory.upgrading && creep.carry.energy == 0) {
            creep.memory.upgrading = false;
            creep.say('harvesting');
        }
        if (!creep.memory.upgrading && creep.carry.energy == creep.carryCapacity) {
            creep.memory.upgrading = true;
            creep.say('upgrading');
        }

        if (creep.memory.upgrading) {
            if (actionUpgrade.upgrade(creep)) {
                return;
            }
            //if primary objective cannot be completed, do something else
            if (actionBuild.build(creep)) {
                return;
            }
            if (actionEnergize.energize(creep)) {
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

module.exports = roleUpgrader;