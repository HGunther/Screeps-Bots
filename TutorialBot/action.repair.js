var actionRepair = {

    /** @param {Creep} creep **/
    repair: function (creep) {
        if (creep.carry.energy > 0) {
            var targets = creep.room.find(FIND_MY_STRUCTURES, {
                filter: (structure) => {
                    return (structure.hits < structure.hitsMax);
                }
            });
            // Try to repair the closest
            var closestToRepair = creep.pos.findClosestByPath(targets);
            var result = creep.repair(closestToRepair);
            if (result == OK) {
                // success!
                return true;
            }
            if (result == ERR_NOT_IN_RANGE) {
                // move closer
                result = creep.moveTo(closestToRepair, {
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
            // failed to repair
            return false;
        }
        // no energy
        return false;

    }
};

module.exports = actionRepair;