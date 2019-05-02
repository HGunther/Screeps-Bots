var actionHarvest = {

    /** @param {Creep} creep **/
    harvest: function (creep) {
        if (creep.carry.energy < creep.carryCapacity) {
            // Try to harvest from the closest
            var closestSource = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
            var result = creep.harvest(closestSource);
            if (result == OK) {
                // success!
                return true;
            }
            if (result == ERR_NOT_IN_RANGE) {
                // move closer
                result = creep.moveTo(closestSource, {
                    visualizePathStyle: {
                        stroke: '#ffaa00'
                    }
                });
                if (result == OK) {
                    return true;
                }
                // could not move
                return false;
            }
            // failed to harvest
            return false;
        }
        // already full
        return false;

    }
};

module.exports = actionHarvest;