var actionRepair = {

    /** @param {Creep} creep **/
    repair: function (creep) {
        if (creep.carry.energy > 0) {
            var repairable = creep.room.find(FIND_MY_STRUCTURES, {
                filter: (structure) => {
                    return (structure.hits < structure.hitsMax);
                }
            });
            // If none of my buildings need repair, check walls and roads
            if (repairable.length < 1) {
                // Finds roads and walls
                repairable = creep.room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return (structure.hits < structure.hitsMax);
                    }
                });
                if (repairable.length < 1) {
                    // nothing to repair
                    return false;
                }
            }
            // Repair what you're next to
            var closest = creep.pos.findClosestByPath(repairable);
            var result = creep.repair(closest);
            if (result == OK) {
                // success!
                return true;
            }
            if (result == ERR_NOT_IN_RANGE) {
                // Move towards lowest health
                repairable.sort((a, b) => a.hits - b.hits);
                var lowestHealth = repairable[0];
                result = creep.moveTo(lowestHealth, {
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