var utils = {
    makeId: function(baseName = ""){
        return baseName + Math.random().toString().slice(2);
        }
}

module.exports = utils;