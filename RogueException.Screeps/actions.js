"use strict";
var listUtils = require('util.list');
var mapUtils = require('util.map');

var actions = {
    //Full:
    rangedHeal: continueRangedHeal,
    repair: continueRepair,
    build: continueBuild,

    //Melee:
    heal: continueHeal,
    //attackController: continueAttackController,
    //dismantle: continueDismantle,
    attack: continueAttack,
    harvest: continueHarvest,

    //Ranged:
    rangedAttack: continueRangedAttack,
    //rangedMassAttack: continueRangedMassAttack,

    //Secondaries
    //flee: continueFlee,
    moveTo: continueMoveTo,

    deposit: continueDeposit,
    giveTo: continueGiveTo,
    pickup: continuePickup,
    takeFrom: continueTakeFrom,
    withdraw: continueWithdraw,
    
    recycle: continueRecycle,
    renew: continueRenew,

    maintain: continueMaintain,
    upgrade: continueUpgrade,
    claim: continueClaim,

    reserve: continueReserve,
};

//Secondary: Movement
module.exports.moveTo = function(creep, target, exact) {
    Game.debug.sayAction(creep, 'moveTo');
    if (doMoveTo(creep, target, exact))
        return false;
    setAction(creep, 'moveTo', { target: mapUtils.serializePos(target), exact: exact });
    return true;
}
function continueMoveTo(creep, action) {
    return doMoveTo(creep, mapUtils.deserializePos(action.target), action.exact);
}
function doMoveTo(creep, target, exact) {
    if (!target)
        return true; //Target not found
    if ((exact && creep.pos.isEqualTo(target)) || (!exact && creep.pos.isNearTo(target)))
        return true; //Target reached
    
    var result = moveTo(creep, target);
    if (result === OK)
        return false; //Continue
    else if (result === ERR_TIRED)
        return false; //Continue
    else
        return true; //Failed
}
function moveTo(creep, pos) {
    if (creep.fatigue !== 0)
        return;

    var creepMemory = creep.memory;
    var pathMemory;
    var path = null;
    if (creepMemory._path)
        pathMemory = creepMemory._path;
        
    if (!pathMemory || //No cached path
            !mapUtils.deserializePos(pathMemory.pos).isEqualTo(pos) || //Different target than cached path 
            pathMemory.index >= pathMemory.path.length - 1 || //Cached path has completed
            pathMemory.stuck > pathMemory.path.length || //Has been stuck for longer than the length of this path
            pathMemory.stuck > 5) { //Has been stuck for 5 steps
        //console.log('New path');
        var path;
        if (creep.pos.roomName === pos.roomName) //Avoid backtracking if target is in this same room
            path = creep.pos.findPathTo(pos, { maxRooms: 1 });
        else
            path = creep.pos.findPathTo(pos);
        pathMemory = setPath(creep, pos, path);
    }
    else {
        if (creep.pos.isEqualTo(mapUtils.deserializePos(pathMemory.lastPos)))
            pathMemory.stuck++;
        else
            pathMemory.index++;
    }
    pathMemory.lastPos = mapUtils.serializePos(creep.pos);
    moveStep(creep, pathMemory);
}
function moveByPath(creep, path) {
    if (path.length > 0) {
        var pathMemory = setPath(creep, path[path.length - 1], path);
        moveStep(creep, pathMemory);
    }
}
function setPath(creep, pos, path) {
    var pathMemory = {
        pos: mapUtils.serializePos(pos),
        lastPos: null,
        tick: Game.time,
        index: 0,
        path: mapUtils.serializeRelativePath(path),
        stuck:  0
    }
    creep.memory._path = pathMemory;
    return pathMemory;
}
function moveStep(creep, pathMemory) {
    //console.log(pathMemory.index + ' / ' + pathMemory.path.length);
    var dir = parseInt(pathMemory.path.substr(pathMemory.index, 1));
    creep.move(dir);
}

function flee(creep, target, distance) {
    Game.debug.sayAction(creep, 'flee');
    var path = PathFinder.search(creep.pos, {
        pos: target.pos, 
        range: distance 
    }, {  
        flee: true, 
        maxRooms: 1
    });
    creep.moveByPath(path.path);
    return true; //Success
}
module.exports.flee = flee;

module.exports.pickup = function(creep, target, allowMove) {
    Game.debug.sayAction(creep, 'pickup');
    if (doPickup(creep, target, allowMove) || !allowMove)
        return false;
    setAction(creep, 'pickup', { target: target.id });
    return true;
}
function continuePickup(creep, action) {
    var target = Game.getObjectById(action.target);
    return doPickup(creep, target, true);
}
function doPickup(creep, target, allowMove) {
    var result = creep.pickup(target);

    if (result === OK)
        return true; //Success
    else if (allowMove && result === ERR_NOT_IN_RANGE) {
        moveTo(creep, target.pos);
        return false;
    }
    else
        return true; //Failed
}

module.exports.recycle = function(creep, target, allowMove) {
    //console.log('Recycling ' + creep.name);
    Game.debug.sayAction(creep, 'recycle');
    if (doRecycle(creep, target, allowMove) || !allowMove)
        return false;
    setAction(creep, 'recycle', { target: target.name });
    return true;
}
function continueRecycle(creep, action) {
    var target = Game.spawns[action.target];
    return doRecycle(creep, target, true);
}
function doRecycle(creep, target, allowMove) {
    if (!target)
        return true; //Unknown target
    if (!creep.pos.isNearTo(target.pos)) {
        if (allowMove) {
            moveTo(creep, target.pos);
            return false;
        }
        return true;
    }
    if (target.spawning)
        return false; //Wait for spawning to finish

    //Only run the following lines if beside the spawner and it is not spawning, otherwise we'll interrupt a spawn
    creep.transfer(target, RESOURCE_ENERGY); //Transfer whatever we have before we blow up
    var result = target.recycleCreep(creep);    

    if (result === OK)
        return true; //Success
    else
        return true; //Failed
}

module.exports.renew = function(creep, target, allowMove) {
    //console.log('Renewing ' + creep.name);
    Game.debug.sayAction(creep, 'renew');
    if (!target)
        return true;
    listUtils.add(target.memory.queue, creep.name);
    if (doRenew(creep, target, allowMove) || !allowMove)
        return false;
    setAction(creep, 'renew', { target: target.name });
    return true;
}
function continueRenew(creep, action) {
    var target = Game.spawns[action.target];
    return doRenew(creep, target, true);
}
function doRenew(creep, target, allowMove) {
    if (!target)
        return true; //Unknown target
    if (!creep.pos.isNearTo(target.pos)) {
        if (allowMove) {
            moveTo(creep, target.pos);
            return false;
        }
        else
            return true;
    }
    return false; //Wait
}

//Secondary: Transfers
module.exports.giveTo = function(creep, target, allowMove, type) {
    Game.debug.sayAction(creep, 'giveTo');
    if (type === undefined)
        type = RESOURCE_ENERGY;

    if (doGiveTo(creep, target, allowMove, type) || !allowMove)
        return false;
    setAction(creep, 'giveTo', { target: target.name, type: type });
    return true;
}
function continueGiveTo(creep, action) {
    var target = Game.creeps[action.target];
    return doGiveTo(creep, target, true, action.type);
}
function doGiveTo(creep, target, allowMove, type) {
    var result = creep.transfer(target, type);

    if (result === OK)
        return true; //Success
    else if (allowMove && result === ERR_NOT_IN_RANGE) {
        moveTo(creep, target.pos);
        return false;
    }
    else
        return true; //Failed
}

module.exports.takeFrom = function(creep, target, allowMove) {
    Game.debug.sayAction(creep, 'takeFrom');
    if (type === undefined)
        type = RESOURCE_ENERGY;

    if (doTakeFrom(creep, target, allowMove, type) || !allowMove)
        return false;
    setAction(creep, 'takeFrom', { target: target.name, type: type });
    return true;
}
function continueTakeFrom(creep, action) {
    var target = Game.creeps[action.target];
    return doTakeFrom(creep, target, true, action.type);
}
function doTakeFrom(creep, target, allowMove, type) {    
    var result = target.transfer(creep, type);

    if (result === OK)
        return true; //Success
    else if (allowMove && result === ERR_NOT_IN_RANGE) {
        moveTo(creep, target.pos);
        return false;
    }
    else
        return true; //Failed
}

module.exports.deposit = function(creep, target, allowMove, resource) {
    Game.debug.sayAction(creep, 'deposit');
    if (resource === undefined)
        resource = RESOURCE_ENERGY;

    if (doDeposit(creep, target, allowMove, resource) || !allowMove)
        return false;
    setAction(creep, 'deposit', { target: target.id, resource: resource });
    return true;
}
function continueDeposit(creep, action) {
    var target = Game.structures[action.target];
    if (!target)
        target = Game.getObjectById(action.target);
    return doDeposit(creep, target, true, action.resource);
}
function doDeposit(creep, target, allowMove, resource) {
    var result = creep.transfer(target, resource);

    if (result === OK)
        return true; //Success
    else if (allowMove && result === ERR_NOT_IN_RANGE) {
        moveTo(creep, target.pos);
        return false;
    }
    else
        return true; //Failed
}

module.exports.withdraw = function(creep, target, allowMove, resource) {
    Game.debug.sayAction(creep, 'withdraw');
    if (resource === undefined)
        resource = RESOURCE_ENERGY;

    if (doWithdraw(creep, target, allowMove, resource) || !allowMove)
        return false;
    setAction(creep, 'withdraw', { target: target.id, resource: resource });
    return true;
}
function continueWithdraw(creep, action) {
    var target = Game.structures[action.target];
    if (!target)
        target = Game.getObjectById(action.target);
    return doWithdraw(creep, target, true, action.resource);
}
function doWithdraw(creep, target, allowMove, resource) {
    var result = creep.withdraw(target, resource);

    if (result === OK)
        return true; //Success
    else if (allowMove && result === ERR_NOT_IN_RANGE) {
        moveTo(creep, target.pos);
        return false;
    }
    else
        return true; //Failed
}

//Builders
module.exports.build = function(creep, target, allowMove) {
    Game.debug.sayAction(creep, 'build');
    if (doBuild(creep, target, allowMove) || !allowMove)
        return false;
    setAction(creep, 'build', { target: target.id });
    return true;
}
function continueBuild(creep, action) {
    var target = Game.constructionSites[action.target];
    return doBuild(creep, target, true);
}
function doBuild(creep, target, allowMove) {
    //Make sure we're not standing on the target...
    if (target && creep.pos.isEqualTo(target.pos)) {
        flee(creep, target, 1);
        return;
    }
    var result = creep.build(target);
    
    if (result === OK)
        return false; //Continue
    else if (allowMove && result === ERR_NOT_IN_RANGE) {
        moveTo(creep, target.pos);
        return false;
    }
    else
        return true; //Failed
}

//Harvesters
module.exports.harvest = function(creep, target, allowMove) {
    Game.debug.sayAction(creep, 'harvest');
    if (doHarvest(creep, target, allowMove) || !allowMove)
        return false;
    setAction(creep, 'harvest', { target: target.id });
    return true;
}
function continueHarvest(creep, action) {
    var target = Game.getObjectById(action.target);
    return doHarvest(creep, target, true);
}
function doHarvest(creep, target, allowMove) {
    var result = creep.harvest(target);

    if (_.sum(creep.carry) === creep.carryCapacity)
        return true; //Full

    if (result === OK)
        return false; //Continue
    else if (allowMove && result === ERR_NOT_IN_RANGE) {
        moveTo(creep, target.pos);
        return false;
    }
    else
        return true; //Failed
}

//Healers
module.exports.heal = function(creep, target, allowMove) {
    Game.debug.sayAction(creep, 'heal');
    if (doHeal(creep, target, allowMove) || !allowMove)
        return false;
    setAction(creep, 'heal', { target: target.name });
    return true;
}
function continueHeal(creep, action) {
    var target = Game.creeps[action.target];
    return doHeal(creep, target, true);
}
function doHeal(creep, target, allowMove) {
    var result = creep.heal(target);

    if (result === OK)
        return false; //Continue
    else if (allowMove && result === ERR_NOT_IN_RANGE) {
        moveTo(creep, target.pos);
        return false;
    }
    else
        return true; //Failed
}

module.exports.rangedHeal = function(creep, target, allowMove) {
    Game.debug.sayAction(creep, 'rangedHeal');
    if (doRangedHeal(creep, target, allowMove) || !allowMove)
        return false;
    setAction(creep, 'rangedHeal', { target: target.name });
    return true;
}
function continueRangedHeal(creep, action) {
    var target = Game.creeps[action.target];
    return doRangedHeal(creep, target, true);
}
function doRangedHeal(creep, target, allowMove) {
    var result = creep.rangedHeal(target);

    if (result === OK)
        return false; //Continue
    else if (allowMove && result === ERR_NOT_IN_RANGE) {
        moveTo(creep, target.pos);
        return false;
    }
    else
        return true; //Failed
}

//Repairers
module.exports.repair = function(creep, target, allowMove) {
    Game.debug.sayAction(creep, 'repair');
    if (doRepair(creep, target, allowMove) || !allowMove)
        return false;
    setAction(creep, 'repair', { target: target.id });
    return true;
}
function continueRepair(creep, action) {
    var target = Game.structures[action.target];
    if (!target)
        target = Game.getObjectById(action.target);
    return doRepair(creep, target, true);
}
function doRepair(creep, target, allowMove) {
    if (!target || target.hits === target.hitsMax)
        return true; //Success
    var result = creep.repair(target);

    if (result === OK)
        return false; //Continue
    else if (allowMove && result === ERR_NOT_IN_RANGE) {
        moveTo(creep, target.pos);
        return false;
    }
    else
        return true; //Failed
}

//Reserver
module.exports.reserve = function(creep, target, allowMove) {
    Game.debug.sayAction(creep, 'reserve');
    if (doReserve(creep, target, allowMove) || !allowMove)
        return false;
    setAction(creep, 'reserve', { target: target.name });
    return true;
}
function continueReserve(creep, action) {
    var target = Game.spawns[action.target];
    return doReserve(creep, target, true);
}
function doReserve(creep, target, allowMove) {
    var result = creep.reserveController(target);

    if (result === OK)
        return true; //Success
    else if (allowMove && result === ERR_NOT_IN_RANGE) {
        moveTo(creep, target.pos);
        return false;
    }
    else
        return true; //Failed
}

//Controllers
module.exports.upgrade = function(creep, target, allowMove) {
    Game.debug.sayAction(creep, 'upgrade');
    if (doUpgrade(creep, target, allowMove) || !allowMove)
        return false;
    setAction(creep, 'upgrade', { target: target.id });
    return true;
}
function continueUpgrade(creep, action) {
    var target = Game.structures[action.target];
    if (!target)
        target = Game.getObjectById(action.target);
    return doUpgrade(creep, target, true);
}
function doUpgrade(creep, target, allowMove) {
    var result = creep.upgradeController(target);

    if (result === OK)
        return false; //Continue
    else if (allowMove && result === ERR_NOT_IN_RANGE) {
        moveTo(creep, target.pos);
        return false;
    }
    else
        return true; //Failed
}

module.exports.maintain = function(creep, target, allowMove) {
    Game.debug.sayAction(creep, 'maintain');
    if (doMaintain(creep, target, allowMove) || !allowMove)
        return false;
    setAction(creep, 'maintain', { target: target.id });
    return true;
}
function continueMaintain(creep, action) {
    var target = Game.structures[action.target];
    if (!target)
        target = Game.getObjectById(action.target);
    return doMaintain(creep, target, true);
}
function doMaintain(creep, target, allowMove) {
    var result = creep.upgradeController(target);

    if (result === OK)
        return true; //Success
    else if (allowMove && result === ERR_NOT_IN_RANGE) {
        moveTo(creep, target.pos);
        return false;
    }
    else
        return true; //Failed
}

module.exports.claim = function(creep, target, allowMove) {
    Game.debug.sayAction(creep, 'claim');
    if (doClaim(creep, target, allowMove) || !allowMove)
        return false;
    setAction(creep, 'claim', { target: target.id });
    return true;
}
function continueClaim(creep, action) {
    var target = Game.structures[action.target];
    if (!target)
        target = Game.getObjectById(action.target);
    return doClaim(creep, target, true);
}
function doClaim(creep, target, allowMove) {
    var result = creep.claimController(target);

    if (result === OK)
        return false; //Continue
    else if (allowMove && result === ERR_NOT_IN_RANGE) {
        moveTo(creep, target.pos);
        return false;
    }
    else
        return true; //Failed
}

//Combat
module.exports.attack = function(creep, target, allowMove) {
    Game.debug.sayAction(creep, 'attack');
    if (doAttack(creep, target, allowMove) || !allowMove)
        return false;
    setAction(creep, 'attack', { target: target.id });
    return true;
}
function continueAttack(creep, action) {
    var target = Game.structures[action.target];
    if (!target)
        target = Game.getObjectById(action.target);
    return doAttack(creep, target, true);
}
function doAttack(creep, target, allowMove) {
    var result = creep.attack(target);

    if (result === OK)
        return true; //Success
    else if (allowMove && result === ERR_NOT_IN_RANGE) {
        moveTo(creep, target.pos);
        return false;
    }
    else
        return true; //Failed
}

module.exports.rangedAttack = function(creep, target, allowMove) {
    Game.debug.sayAction(creep, 'rangedAttack');
    if (doRangedAttack(creep, target, allowMove) || !allowMove)
        return false;
    setAction(creep, 'rangedAttack', { target: target.id });
    return true;
}
function continueRangedAttack(creep, action) {
    var target = Game.structures[action.target];
    if (!target)
        target = Game.getObjectById(action.target);
    return doRangedAttack(creep, target, true);
}
function doRangedAttack(creep, target, allowMove) {
    var result = creep.rangedAttack(target);

    if (result === OK)
        return true; //Success
    else if (allowMove && result === ERR_NOT_IN_RANGE) {
        moveTo(creep, target.pos);
        return false;
    }
    else
        return true; //Failed
}

//Utilities
function setAction(creep, type, data) {
    if (!data)
        data = {};
    data.type = type;
    creep.memory._action = data;
}
module.exports.continueAction = function(creep) {
    var actionData = creep.memory._action;
    if (!actionData)
        return false;
    var action = actions[actionData.type];
    if (!action)
        return false;

    var completed = action(creep, actionData);
    if (completed)
        delete creep.memory._action;
    return !completed;
}

module.exports.hasAction = function(creep, type) {
    return creep.memory._action && creep.memory._action.type === type;
}

module.exports.hasAnyAction = function(creep) {
    return creep.memory._action !== undefined;
}