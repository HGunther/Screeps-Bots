"use strict";
module.exports.get = function(initialParts, repeatParts, maxCost) {
    var body = [].concat(initialParts);
    var currentCost = getCost(initialParts);
    var nextCost;

    if (repeatParts.length > 0) {
        var partsCost = getCost(repeatParts);
        nextCost = currentCost + partsCost;
        while(nextCost <= maxCost || body.length === 0) {
            body = body.concat(repeatParts);
            currentCost += partsCost;
            nextCost += partsCost;
        }

        //Body cannot have more than 50 parts
        if (body.length > 50) {
            body = body.slice(0, 50);
            currentCost = getCost(body);
            nextCost = 0;
        }
        else if (body.length + repeatParts.length > 50) {
            var nextBody = body.concat(repeatParts.slice(0, 50 - (body.length + repeatParts.length))) 
            nextCost = getCost(nextBody);
        }
    }
    else
        nextCost = 0;

    return {
        body: body,
        cost: currentCost,
        upgradeCost: nextCost
    };
}

module.exports.getPowerLevel = function(creep) {
    var hits = creep.hits;
    var body = creep.body;
    var power = 0;
    var boostMul = 1.0;
    var isMilitary = false;
    for (let i = 0; i < body.length; i++) {
        var part = body[i];
        var boosts = {};
        if (part.hits > 0) {
            switch (part.type) {
                case ATTACK:
                    power += 70; //80-10
                    isMilitary = true;
                    break;
                case RANGED_ATTACK:
                    power += 140; //150-10
                    isMilitary = true;
                    break;
                case HEAL:
                    power += 240; //250-10
                    isMilitary = true;
                    break;
            }
            power += part.hits * 0.1;
            if (part.boost !== undefined && boosts[part.type] === undefined) {
                boosts[part.type] = true;
                boostMul += 0.2;
            }
        }
    }
    if (isMilitary === true)
        return Math.round(power * boostMul);
    else
        return 0;
}

function getCost(body) {
    var cost = 0;
    for (let i = 0; i < body.length; i++) {
        if (body[i].type)
            cost += BODYPART_COST[body[i].type];
        else
            cost += BODYPART_COST[body[i]];
    }
    return cost;
}
module.exports.getCost = getCost;