var globals = require('globals');
var utils = require('utils');

var manageCreepCount = {

    manage: function() {
        // if(Game.resources.)
        var creeps_desired = {
            harvester: 2,
            upgrader: 3,
            builder: 3
        };
        
        for(var role in creeps_desired){
            var count = (_.filter(Game.creeps, (creep) => creep.memory.role == role)).length;
            if(count < creeps_desired[role]){
                newCreepName = utils.makeId();
                newCreepRole = role;
                
                Game.spawns[globals.spawnName].spawnCreep([WORK, CARRY, MOVE], newCreepName, {memory: {role: newCreepRole}});
            }
        }
    }

};

module.exports = manageCreepCount;