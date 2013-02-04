
module.exports = function () {
    return new Queue();
};

function Queue() {
    this._tasks = [];
}

Queue.prototype.push = function (task) {
    this._tasks.push(task);
};

Queue.prototype.pop = function () {
    var task = this._tasks.shift();

    return ((typeof task !== 'undefined') ? task : undefined);
};
