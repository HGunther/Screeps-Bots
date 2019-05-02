"use strict";
var listUtils = require("util.list");
var partUtils = require("util.parts");
var memoryUtils = require("util.memory");
var requestUtils = require("util.requests");
const STATE_BUILDING = 'building';
const STATE_ATTACKING = 'attacking';

module.exports.updateGlobal = function(actions) {
    for (let flagName in Game.flags) {
        var flag = Game.flags[flagName];
        if (flag.color === COLOR_RED) {
            var flagMemory = flag.memory;
            if (!flagMemory) {
                flagMemory = { 
                    targetPower: 5000
                };
                Memory.flags[flagName] = flagMemory;
            }
            
            var squadMemory = Memory.military.squads[flag.name];
            if (!squadMemory) {
                squadMemory = memoryUtils.createSquad();
                Memory.military.squads[flag.name] = squadMemory;
                console.log('Squad ' + flag.name + ': Building');
            }
        }
    }

    for (let squadName in Memory.military.squads) {
        var squadMemory = Memory.military.squads[squadName];
        var flag = Game.flags[squadName];
        if (!flag) { //Disband
            console.log('Squad ' + squadName + ': Disbanding');

            //Unassign remaining squad members (will push them to defense)
            for (let i = 0; i < squadMemory.creeps; i++)
                delete Memory.creeps[squadMemory.creeps[i]].squad;
            delete Memory.military.squads[squadName];
            continue;
        }
        
        var power = 0;
        var melee = 0;
        var ranged = 0;
        var heal = 0;
        for (let i = 0; i < squadMemory.creeps.length; i++) {
            var creep = Game.creeps[squadMemory.creeps[i]];
            if (!creep) {
                listUtils.removeAt(squadMemory.creeps, i)
                i--;
                continue;
            }

            if (!creep.spawning) {
                power += partUtils.getPowerLevel(creep);
                melee += creep.getActiveBodyparts(ATTACK);
                ranged += creep.getActiveBodyparts(RANGED_ATTACK);
                heal += creep.getActiveBodyparts(HEAL);
            }
        }
        squadMemory.power = power;
        squadMemory.targetPower = flag.memory.targetPower;
        squadMemory.melee = melee;
        squadMemory.ranged = ranged;
        squadMemory.heal = heal;
        
        if (squadMemory.state === STATE_ATTACKING) {
            if (squadMemory.power === 0) {
                squadMemory.state = STATE_BUILDING;
                console.log('Squad ' + squadName + ': Building');
            }

            //No special logic yet
        }

        if (squadMemory.state === STATE_BUILDING) {
            if (squadMemory.targetPower !== 0 && power >= squadMemory.targetPower) {
                squadMemory.state = STATE_ATTACKING;
                for (let i = 0; i < squadMemory.creeps.length; i++) {
                    var creepMemory = Memory.creeps[squadMemory.creeps[i]];
                    creepMemory.room = flag.pos.roomName;
                }
                console.log('Squad ' + squadName + ': Attacking');
            }
        }
    }
}

module.exports.updateBase = function(base, actions, creepRequests, structureRequests, defenseRequests) {
    for (let squadName in Memory.military.squads) {
        var squadMemory = Memory.military.squads[squadName];
        if (squadMemory.state === STATE_BUILDING && squadMemory.power < squadMemory.targetPower) {
            var memory = {
                military: true,
                squad: squadName
            };
            if (squadMemory.heal < Math.floor((squadMemory.ranged + squadMemory.melee) / 4))
                memory.role = 'healer';
            else if (squadMemory.ranged < squadMemory.melee)
                memory.role = 'ranged';
            else
                memory.role = 'melee';

            requestUtils.add(creepRequests, 0.8, memory);
        }
    }
}