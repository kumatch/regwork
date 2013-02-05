var expect = require('chai').expect;
var regwork = require('../');

describe('Regwork worker', function () {
    var worker;

    beforeEach(function () {
        worker = null;
    });

    afterEach(function () {
        worker.stop();
    });

    it('should run specific work (start before adds)', function (done) {
        var count = 0;

        worker = regwork(function (params, end) {
            count += params.number;
            end();
        });

        worker.start({ interval: 10 });

        worker.add({ number: 1 });
        worker.add({ number: 2 });
        worker.add({ number: 3 });
        worker.add({ number: 4 });

        setTimeout(function () {
            expect(count).be.equal(10);
            done();
        }, 100);
    });

    it('should run specific work (start after adds)', function (done) {
        var count = 0;

        worker = regwork(function (params, end) {
            count += params.number;
            end();
        });

        worker.add({ number: 1 });
        worker.add({ number: 2 });
        worker.add({ number: 3 });
        worker.add({ number: 4 });

        setTimeout(function () {
            expect(count).be.equal(10);
            done();
        }, 100);

        worker.start({ interval: 10 });
    });

    it('should not run specific work if not start', function (done) {
        var count = 0;

        worker = regwork(function (params, end) {
            done(Error('work runned.'));
        });

        worker.add({ number: 1 });
        worker.add({ number: 2 });
        worker.add({ number: 3 });
        worker.add({ number: 4 });

        setTimeout(function () {
            expect(count).be.equal(0);
            done();
        }, 100);
    });


    it('should stop worker if not callback', function (done) {
        var count = 0;

        worker = regwork(function (params, end) {
            count += params.number;
        });

        worker.start({ interval: 10 });

        worker.add({ number: 1 });
        worker.add({ number: 2 });
        worker.add({ number: 3 });
        worker.add({ number: 4 });

        setTimeout(function () {
            expect(count).be.equal(1);
            done();
        }, 100);
    });


    it('should stop worker if stop', function (done) {
        var count = 0;

        worker = regwork(function (params, end) {
            if (count > 5) {
                worker.stop();
            } else {
                count += params.number;
            }

            end();
        });

        worker.start({ interval: 10 });

        worker.add({ number: 1 });
        worker.add({ number: 2 });
        worker.add({ number: 3 });
        worker.add({ number: 4 });

        setTimeout(function () {
            expect(count).be.equal(6);
            done();
        }, 100);
    });
});


describe('Regwork concurrency work', function () {
    var worker;
    var results;
    var concurrency = 10;

    beforeEach(function () {
        results = { foo: 0, bar: 0 };

        worker = regwork(function (params, end) {
            var timer = 0;

            if (params.foo) {
                results.foo += 1;
                timer += 50;
            }

            if (params.bar) {
                results.bar += 1;
                timer += 75;
            }

            // console.log(results);
            // console.log(worker.countRuns());

            expect(worker.countRuns()).to.be.at.most(concurrency);

            setTimeout(function () {
                end();
            }, timer);
        });
    });

    afterEach(function () {
        worker.stop();
        worker = null;
    });

    it('should run concurrency less than set number', function (done) {
        var count = 5;

        worker.start({ concurrency: concurrency, interval: 5 });

        var timer = setInterval(function() {
            if (results.foo === (count * 2) && results.bar === (count * 2)) {
                clearInterval(timer);
                done();
            }
        }, 10);

        for (var i = 0; i < count; i++) {
            worker.add({ foo: 1 });
            worker.add({ bar: 1 });
            worker.add({ foo: 1, bar: 1 });
        }
    });

    it('should run concurrency less than set number (no set interval)', function (done) {
        var count = 5;

        worker.start(concurrency);

        var timer = setInterval(function() {
            if (results.foo === (count * 2) && results.bar === (count * 2)) {
                clearInterval(timer);
                done();
            }
        }, 10);

        for (var i = 0; i < count; i++) {
            worker.add({ foo: 1 });
            worker.add({ bar: 1 });
            worker.add({ foo: 1, bar: 1 });
        }
    });

    it('should run concurrency 1 (low speed)', function (done) {
        var count = 5;

        worker.start();

        var timer = setInterval(function() {
            if (results.foo === (count * 2) && results.bar === (count * 2)) {
                clearInterval(timer);
                done();
            }
        }, 10);

        for (var i = 0; i < count; i++) {
            worker.add({ foo: 1 });
            worker.add({ bar: 1 });
            worker.add({ foo: 1, bar: 1 });
        }
    });
});



describe('Regwork original queue', function () {
    var worker;

    var createQueue = function () {
        var params = [];

        return {
            push: function (value, callback) {
                params.push(value * 2);
                callback();
            },

            pop: function (callback) {
                var value = params.shift();

                if (typeof value === 'undefined') {
                    return callback();
                }

                if (value > 0) {
                    return callback(null, value + 10);
                } else {
                    return callback(null, 0);
                }
            }
        };
    };


    afterEach(function () {
        worker.stop();
    });

    it('should run work with original queue', function (done) {
        var count = 0;
        var work = function (value, end) {
            count += value;
            end();
        };
        var queue = createQueue();

        worker = regwork(work, queue);

        worker.start({ interval: 10 });

        worker.add(1);
        worker.add(2);
        worker.add(3);
        worker.add(4);

        setTimeout(function () {
            expect(count).be.equal(60);
            done();
        }, 100);
    });
});

describe('Regwork original queue and error handling', function () {
    var worker;

    var createQueue = function () {
        var params = [];

        return {
            push: function (value, callback) {
                params.push(value);

                if (value >= 0) {
                    callback();
                } else {
                    callback(value);
                }
            },

            pop: function (callback) {
                var value = params.shift();

                if (value < 10) {
                    callback(null, value);
                } else {
                    callback(value);
                }
            }
        };
    };

    afterEach(function () {
        worker.stop();
    });

    it('should raise error in push', function (done) {
        var count = 0;

        var work = function (value, end) {
            count += value;
            end();
        };
        var queue = createQueue();

        worker = regwork(work, queue);
        worker.on('error', function (err) {
            expect(err).be.equal(-10);
            done();
        });

        worker.start({ interval: 10 });

        worker.add(1);
        worker.add(2);
        worker.add(3);
        worker.add(-10);
    });

    it('should raise error in pop', function (done) {
        var count = 0;

        var work = function (value, end) {
            count += value;
            end();
        };
        var queue = createQueue();

        worker = regwork(work, queue);
        worker.on('error', function (err) {
            expect(err).be.equal(20);
            done();
        });

        worker.start({ interval: 10 });

        worker.add(1);
        worker.add(2);
        worker.add(3);
        worker.add(8);
        worker.add(9);
        worker.add(20);
    });
});