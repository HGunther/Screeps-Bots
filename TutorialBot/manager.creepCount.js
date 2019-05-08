var globals = require('globals');
var utils = require('utils');

var manageCreepCount = {

    manage: function () {
        // if(Game.resources.)
        var creep_queue = [{
                role: "harvester",
                number: 4
            },
            {
                role: "upgrader",
                number: 2
            },
            {
                role: "builder",
                number: 4
            },
            {
                role: "repairer",
                number: 4
            },
            {
                role: "upgrader",
                number: 3
            },
            {
                role: "repairer",
                number: 8
            }
        ];

        for (var creep in creep_queue) {
            var role = creep["role"];
            var count = (_.filter(Game.creeps, (creep) => creep.memory.role == role)).length;
            if (count < creep["number"]) {
                var newCreepRole = role;
                var newCreepName = utils.makeId(newCreepRole);

                Game.spawns[globals.spawnName].spawnCreep([WORK, CARRY, MOVE], newCreepName, {
                    memory: {
                        role: newCreepRole
                    }
                });
                return;
            }
        }
    }

};

module.exports = manageCreepCount;