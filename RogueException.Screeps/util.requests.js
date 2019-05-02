"use strict";
var listUtils = require('util.list');

module.exports.add = function(arr, priority, data) {
    listUtils.add(arr, { 
        priority: priority,
        data: data
    });
}
module.exports.pop = function(arr) {
    if (arr.length === 0)
        return null;
    
    var bestIndex = null;
    for (let i = 0; i < arr.length; i++) {
        var request = arr[i];
        if (bestIndex === null || request.priority > arr[bestIndex].priority)
            bestIndex = i;
    }
    
    var bestRequest = arr[bestIndex];
    listUtils.removeAt(arr, bestIndex);
    return bestRequest;
}