var actionUpgrade = {

    /** @param {Creep} creep **/
    upgrade: function (creep) {
        if (creep.carry.energy > 0) {
            // Try to upgrade
            var result = creep.upgradeController(creep.room.controller);
            if (result == OK) {
                // success!
                return true;
            }
            if (result == ERR_NOT_IN_RANGE) {
                // move closer
                creep.moveTo(creep.room.controller, {
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
            // failed to upgrade
            return false;
        }
        // no energy
        return false;

    }
};

module.exports = actionUpgrade;