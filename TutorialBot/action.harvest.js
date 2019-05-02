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
                creep.moveTo(closestSource, {
                    visualizePathStyle: {
                        stroke: '#ffaa00'
                    }
                });
                if (result != OK) {
                    // could not move
                    return false;
                }
                return true;
            }
            // failed to harvest
            return false;
        }
        // already full
        return false;

    }
};

module.exports = actionHarvest;