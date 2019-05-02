"use strict";
module.exports.add = function(arr, value) {
    arr.push(value);
}

module.exports.contains = function(arr, value) {
    return arr.indexOf(value) >= 0;
}

module.exports.remove = function(arr, value) {
    var index = arr.indexOf(value);
    if (index !== -1)
        arr.splice(index, 1);
}

module.exports.removeAt = function(arr, index) {
    arr.splice(index, 1);
}