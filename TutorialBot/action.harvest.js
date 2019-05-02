var actionHarvest = {

    /** @param {Creep} creep **/
    harvest: function (creep) {
        if (creep.carry.energy < creep.carryCapacity) {
            var sources = creep.room.find(FIND_SOURCES);
            var goals = []

            for (var source in sources) {
                // Try harvesting from each source
                if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
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