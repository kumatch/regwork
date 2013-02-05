var EventEmitter = require('events').EventEmitter;

module.exports = function (work, queue) {
    var running = false;
    var runs = 0;
    var concurrency = 1;
    var event = new EventEmitter();

    if (!queue) {
        queue = require('./queue')();
    }

    var resume = function () {
        if (!running) return;
        if (runs >= concurrency) return;

        queue.pop(function (err, params) {
            if (err) {
                event.emit('error', err);
            }

            if (typeof params === 'undefined') return;

            runs += 1;

            process.nextTick(function () {
                work(params, function (err) {
                    if (err) throw err;
                    runs -= 1;
                    resume();
                });
            });

            process.nextTick(function () {
                resume();
            });
        });
    };

    event.start = function (c) {
        running = true;
        concurrency = c || 1;

        resume();
    };

    event.stop = function () {
        running = false;
    };

    event.add = function (params) {
        queue.push(params, function (err) {
            if (err) {
                event.emit('error', err);
            } else {
                resume();
            }
        });
    };

    event.countRuns = function () {
        return runs;
    };

    return event;
};
