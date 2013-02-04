
module.exports = function (work, queue) {
    var running = false;
    var runs = 0;
    var concurrency = 1;

    if (!queue) {
        queue = require('./queue')();
    }

    var resume = function () {
        if (!running) return;
        if (runs >= concurrency) return;

        var params = queue.pop();
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
    };

    return {
        start: function (c) {
            running = true;
            concurrency = c || 1;

            resume();
        },

        stop: function () {
            running = false;
        },

        add: function (params) {
            queue.push(params);
            resume();
        },

        countRuns: function () {
            return runs;
        }
    };
};
