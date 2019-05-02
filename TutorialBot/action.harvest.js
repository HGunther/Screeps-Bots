var actionHarvest = {

    /** @param {Creep} creep **/
    harvest: function (creep) {
        if (creep.carry.energy < creep.carryCapacity) {
            // Try to harvest from the closest
            var closestSource = creep.pos.findClosestByPath(FIND_SOURCES);
            var result = creep.harvest(closestSource);
            if (result == OK) {
                // success!
                return true;
            }
            if (result == ERR_NOT_IN_RANGE) {
                // move closer
                var pathToClosest = PathFinder.search(creep.pos, closestSource);
                creep.moveByPath(pathToClosest, {
                    visualizePathStyle: {
                        stroke: '#ffaa00'
                    }
                });
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