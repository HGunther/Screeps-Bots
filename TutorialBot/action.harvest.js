var actionHarvest = {

    /** @param {Creep} creep **/
    harvest: function (creep) {
        if (creep.carry.energy < creep.carryCapacity) {
            var sources = creep.room.find(FIND_SOURCES);
            var goals = []

            for (source in sources) {
                // Try harvesting from each source
                if (creep.harvest(sources[0]) == ERR_NOT_IN_RANGE) {
                    goals.push(source.pos);
                } else {
                    return true;
                }
            }
            // If all out of range, find closest and move towards it
            var path = PathFinder.search(creep.pos, goals);
            creep.moveByPath(path, {
                visualizePathStyle: {
                    stroke: '#ffaa00'
                }
            });
            return true;
        }
        return false;
    }
};

module.exports = actionHarvest;