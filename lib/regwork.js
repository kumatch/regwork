var EventEmitter = require('events').EventEmitter;

module.exports = function (work, queue) {
    var runs = 0;
    var concurrency = 1;
    var event = new EventEmitter();

    var timer = null;

    if (!queue) {
        queue = require('./queue')();
    }

    var resume = function () {
        if (runs >= concurrency) return;

        queue.pop(function (err, params) {
            if (err) {
                event.emit('error', err);
                return;
            }

            if (typeof params === 'undefined') {
                return;
            }

            runs += 1;

            process.nextTick(function () {
                work(params, function (err) {
                    if (err) throw err;
                    runs -= 1;
                });
            });
        });
    };

    event.start = function (option) {
        var interval;

        if (typeof option === 'object') {
            concurrency = option.concurrency || 1;
            interval = option.interval || 50;
        } else {
            concurrency = option || 1;
            interval = 50;
        }

        timer = setInterval(function () {
            resume();
        }, interval);
    };

    event.stop = function () {
        clearInterval(timer);
        timer = null;
    };

    event.add = function (params) {
        queue.push(params, function (err) {
            if (err) event.emit('error', err);
        });
    };

    event.countRuns = function () {
        return runs;
    };

    return event;
};
