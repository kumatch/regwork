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

            if (params.number == 0) {
                expect(count).be.equal(10);
                done();
            }
        });

        worker.start();

        worker.add({ number: 1 });
        worker.add({ number: 2 });
        worker.add({ number: 3 });
        worker.add({ number: 4 });
        worker.add({ number: 0 });
    });

    it('should run specific work (start after adds)', function (done) {
        var count = 0;

        worker = regwork(function (params, end) {
            count += params.number;
            end();

            if (params.number == 0) {
                expect(count).be.equal(10);
                done();
            }
        });

        worker.add({ number: 1 });
        worker.add({ number: 2 });
        worker.add({ number: 3 });
        worker.add({ number: 4 });
        worker.add({ number: 0 });

        worker.start();
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
        worker.add({ number: 5 });

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

        worker.start();

        worker.add({ number: 1 });
        worker.add({ number: 2 });
        worker.add({ number: 3 });
        worker.add({ number: 4 });
        worker.add({ number: 5 });

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

        worker.start();

        worker.add({ number: 1 });
        worker.add({ number: 2 });
        worker.add({ number: 3 });
        worker.add({ number: 4 });
        worker.add({ number: 5 });

        setTimeout(function () {
            expect(count).be.equal(6);
            done();
        }, 100);
    });
});


describe('Regwork concurrency work', function () {
    var worker;
    var concurrency = 10;

    var results = { foo: 0, bar: 0 };

    beforeEach(function () {
        worker = regwork(function (params, end) {
            var timer = 0;

            if (params.foo) {
                results.foo += 1;
                timer += 10;
            }

            if (params.bar) {
                results.bar += 1;
                timer += 20;
            }

            // console.log(results);
            // console.log(worker.countRuns());

            setTimeout(function () {
                expect(worker.countRuns()).to.be.at.most(concurrency);
                end();
            }, timer);
        });
    });

    afterEach(function () {
        worker.stop();
    });

    it('should run concurrency less than set number', function (done) {
        var count = 30;

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
        var count = 50;

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
            push: function (value) {
                params.push(value * 2);
            },

            pop: function () {
                var value = params.shift();

                if (typeof value === 'undefined') return undefined;

                if (value > 0) {
                    return (value + 10);
                } else {
                    return 0;
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

            if (value == 0) {
                expect(count).be.equal(60);
                done();
            }
        };
        var queue = createQueue();

        worker = regwork(work, queue);

        worker.start();

        worker.add(1);
        worker.add(2);
        worker.add(3);
        worker.add(4);
        worker.add(0);
    });
});