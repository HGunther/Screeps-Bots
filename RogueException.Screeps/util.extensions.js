"use strict";
Array.prototype.add = function(value) {
    this.push(value);
}

Array.prototype.remove = function(value) {
    var index = this.indexOf(value);
    if (index !== -1)
        this.splice(index, 1);
}

Array.prototype.removeAt = function(index) {
    this.splice(index, 1);
}