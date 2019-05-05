var actionEnergize = {

    /** @param {Creep} creep **/
    energize: function (creep) {
        if (creep.carry.energy > 0) {
            // List energy structures
            var targets = creep.room.find(FIND_MY_STRUCTURES, {
                filter: (structure) => {
                    return (typeof(structure.energy) !== "undefined" && structure.energy < structure.energyCapacity);
                }
            });
            // Try to build the closest
            var closestNeedingEnergy = creep.pos.findClosestByPath(targets);
            var result = creep.transfer(closestNeedingEnergy, RESOURCE_ENERGY);
            if (result == OK) {
                // success!
                return true;
            }
            if (result == ERR_NOT_IN_RANGE) {
                // move closer
                result = creep.moveTo(closestNeedingEnergy, {
                    visualizePathStyle: {
                        stroke: '#ffffff'
                    }
                });
                if (result == OK || result == ERR_TIRED) {
                    return true;
                }
                // could not move
                return false;
            }
            // failed to transfer
            return false;
        }
        // no energy
        return false;

    }
};

module.exports = actionEnergize;