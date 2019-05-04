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
            if (targets.length < 1) {
                // Finds roads and walls
                targets = creep.room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return (structure.hits < structure.hitsMax);
                    }
                });
                if (targets.length < 1) {
                    // nothing to repair
                    return false;
                }
            }
            // Repair the lowest health
            targets.sort((a, b) => a.hits - b.hits);
            var result = creep.repair(targets[0]);
            if (result == OK) {
                // success!
                return true;
            }
            creep.say(result);
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