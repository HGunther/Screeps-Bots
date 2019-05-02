var actionBuild = {

    /** @param {Creep} creep **/
    build: function (creep) {
        if (creep.carry.energy > 0) {
            // Try to build the closest
            var closestConstruction = creep.pos.findClosestByPath(FIND_MY_CONSTRUCTION_SITES);
            var result = creep.build(closestConstruction);
            if (result == OK) {
                // success!
                return true;
            }
            if (result == ERR_NOT_IN_RANGE) {
                // move closer
                creep.moveTo(closestConstruction, {
                    visualizePathStyle: {
                        stroke: '#ffffff'
                    }
                });
                if (result != OK) {
                    // could not move
                    return false;
                }
                return true;
            }
            // failed to build
            return false;
        }
        // no energy
        return false;

    }
};

module.exports = actionBuild;