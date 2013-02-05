
module.exports = function () {
    return new Queue();
};

function Queue() {
    this._tasks = [];
}

Queue.prototype.push = function (task, callback) {
    try {
        this._tasks.push(task);
        callback();
    } catch (err) {
        callback(err);
    }
};

Queue.prototype.pop = function (callback) {
    try {
        var task = this._tasks.shift();
        var result = (typeof task !== 'undefined') ? task : undefined;

        return callback(null, result);
    } catch (err) {
        callback(err);
    }
};
