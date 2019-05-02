"use strict";
var listUtils = require("util.list");
var requestUtils = require("util.requests");

var baseCache = {};

module.exports.updateGlobal = function(actions) {
}

module.exports.updateBase = function(base, actions, creepRequests, structureRequests, defenseRequests) {
    var baseMemory = base.memory;
    var level = Game.rooms[base.name].controller.level;
    var roles = baseMemory.roles;
    var collectors = roles['collector'];
    var collectorCarryParts = collectors.parts.carry;
    var harvesterCount = roles['harvester'].creeps.length;
    var coreRechargerCount = roles['recharger_core'].creeps.length;
    var rechargerCount = roles['recharger'].creeps.length;
    var upgraderCount = roles['upgrader'].creeps.length;
    var scavengerCount = roles['scavenger'].creeps.length;
    var towerCount = baseMemory.structures[STRUCTURE_TOWER].length;
    var storageCount = baseMemory.structures[STRUCTURE_STORAGE].length;
    var sources = [];
    
    var maxCollectorPartCount = 0;
    var maxCollectorCount = 0;
    var criticalCollectors = 0;
    for (let i = 0; i < baseMemory.sources.length; i++) {
        var sourceMemory = Memory.sources[baseMemory.sources[i]];
        var sourceCollectors = sourceMemory.collectors;
        if (sourceMemory.container.id) {
            var distance = sourceMemory.distance * 2; //There and back
            var carry = 0;
            for (let j = 0; j < sourceCollectors.length; j++) {
                var creepMemory = Memory.creeps[sourceCollectors[j]];
                if (!creepMemory) {
                    listUtils.removeAt(sourceCollectors, j--);
                    continue;
                }
                carry += creepMemory.parts.carry;
            }

            var isCritical = sourceCollectors.length === 0 && sourceMemory.container.amount >= 1950;
            if (isCritical)
                criticalCollectors++;
            var maxCarry = Math.ceil(distance / 3);
            var maxCount = Math.ceil(distance / 65);
            maxCollectorPartCount += maxCarry;
            maxCollectorCount += maxCount;

            var remainingCarry
            if ((sourceMemory.harvesters.length > 0 && sourceMemory.container.amount > 50 * carry && carry < maxCarry) || isCritical) {
                var entry = { id: baseMemory.sources[i], remaining: sourceMemory.container.amount - 50 * carry };
                /*if (base.name === 'W8N2')
                    console.log(baseMemory.sources[i] + ' needs pickup (' + entry.remaining + ')');*/
                listUtils.add(sources, entry);
            }
        }
    }

    //console.log(base.name + " wants " + maxCollectorPartCount + " parts, up to " + maxCollectorCount + " creeps.");

    //maxCollectorPartCount = Math.min(100, maxCollectorPartCount);
    if (base.dropoffs.length === 0)
        maxCollectorPartCount /= 2; //If we have nowhere to put energy, dont spawn as many collectors
    if (criticalCollectors > 3)
        criticalCollectors = 3; //Cap critical collectors

    if (sources.length !== 0 && collectorCarryParts < maxCollectorPartCount && 
            collectors.creeps.length < maxCollectorCount) {
        var priority;
        var memory = { role: 'collector' };
        if (criticalCollectors > collectors.creeps.length)
            priority = 0.98;
        else
            priority = 0.78;
        requestUtils.add(creepRequests, priority, memory);
    }

    for (let i = 0; i < collectors.creeps.length && sources.length !== 0; i++) {
        var name = collectors.creeps[i];
        var creep = Game.creeps[name];
        if (creep.carry.energy !== 0)
            continue;

        var creepMemory = Memory.creeps[name];
        var capacity = creep.carryCapacity - _.sum(creep.carry);
        if (!creepMemory.target) {
            var bestIndex = -1;
            for (let j = 0; j < sources.length; j++) {
                //Select the closest container if it has more energy than we can hold
                if (sources[j].remaining >= capacity) {
                    bestIndex = j; 
                    break;
                }

                //Otherwise choose the one with the most energy
                var sourceMemory = sources[j];
                if (bestIndex === -1 || sources[j].remaining > sources[bestIndex].remaining)
                    bestIndex = j;
            }

            var sourceId = sources[bestIndex].id;
            sources[bestIndex].remaining -= capacity;
            if (sources[bestIndex].remaining <= 0)
                listUtils.removeAt(sources, bestIndex);

            creepMemory.target = sourceId;
            /*if (base.name === 'W8N2')
                console.log('Sending ' + name + ' to ' + sourceId);*/
            listUtils.add(Memory.sources[sourceId].collectors, name);    
        }
    }

    var targetCoreRechargerCount = Math.floor(baseMemory.structures[STRUCTURE_EXTENSION].length / 15) + 1;
    if (storageCount !== 0 && coreRechargerCount < targetCoreRechargerCount) {
        var memory = { role: 'recharger_core' };
        if (coreRechargerCount === 0)
            requestUtils.add(creepRequests, 0.99, memory);
        else
            requestUtils.add(creepRequests, 0.97, memory);
    }

    var targetRechargerCount = towerCount;    
    if (level > 1)
        targetRechargerCount += Math.floor((upgraderCount /*+ defenseBuilderCount + roadBuilderCount + structureBuilderCount*/) * 0.5);
    if (rechargerCount < targetRechargerCount) {
        var priority;
        var memory = { role: 'recharger' };
        if (rechargerCount < towerCount)
            priority = 0.94;
        else
            priority = 0.79;
        requestUtils.add(creepRequests, priority, memory);
    } 

    if (scavengerCount === 0 && base.droppedEnergy.length !== 0) {
        var memory = {
            role: 'scavenger',
        };
        requestUtils.add(creepRequests, 0.99, memory);
    }
}