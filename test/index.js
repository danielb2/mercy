'use strict';

// Load modules

const Code = require('code');
const Hapi = require('hapi');
const Hoek = require('hoek');
const Joi = require('joi');
const Lab = require('lab');
const Insync = require('insync');

const Mercy = require('../lib');


// Test shortcuts

const lab = exports.lab = Lab.script();
const { describe, it } = lab;
const expect = Code.expect;


// Declare internals

const internals = {
    noop: (data, next) => { return next(); },
    echo: (value, next) => { return next(null, value); },
    console: (value, next) => {

        console.log({ console: value });
        return next(null, value);
    },
    preRegister: function (server, next) {

        server.route({
            method: 'GET',
            path: '/status/{p*}',
            handler: (request, reply) => {

                return reply({ status: 'ok' });
            }
        });

        return next();
    }
};


describe('Mercy', () => {

    it('creates root', (done) => {

        expect(Mercy._isMercy).to.be.true();
        expect(Mercy.flow).to.be.a.function();

        done();
    });

    it('creates (empty) flow', (done) => {

        const flow = Mercy.flow();

        expect(flow.flow).to.not.exist();
        expect(flow._children).to.have.length(0);

        done();
    });

    it('creates (empty) flow - `object {}` notaiton', (done) => {

        const flow = Mercy.flow({});

        expect(flow.flow).to.not.exist();
        expect(flow._children).to.have.length(0);

        done();
    });

    it('creates (single function) flow', (done) => {

        const flow = Mercy.flow(internals.noop);

        expect(flow.flow).to.not.exist();
        expect(flow._children).to.have.length(1);
        expect(flow._children[0].task).to.be.a.function();

        done();
    });

    it('prevents creation of (single mercy object) flow', (done) => {

        const throwable = () => { Mercy.flow(Mercy.flow()); };

        expect(throwable).to.throw();

        done();
    });

    it('creates (single function) flow - `array []` notaiton', (done) => {

        const flow = Mercy.flow([internals.noop]);

        expect(flow.flow).to.not.exist();
        expect(flow._children).to.have.length(1);
        expect(flow._children[0].task).to.be.a.function();

        done();
    });

    it('creates (single function) flow - `object {}` notaiton', (done) => {

        const flow = Mercy.flow({ foo: internals.noop });

        expect(flow.flow).to.not.exist();
        expect(flow._children).to.have.length(1);
        expect(flow._children[0].task).to.be.a.object();
        expect(flow._children[0].task._children).to.have.length(1);
        expect(flow._children[0].task._children[0].task).to.be.a.function();

        done();
    });

    it('creates (multi function) flow - `rest ()` notaiton', (done) => {

        const flow = Mercy.flow(internals.noop, internals.noop).final((data, next) => {

            const task_0 = data['task_0'];
            const task_1 = data['task_1'];

            return next(null, { task_0, task_1 });
        });

        expect(flow.flow).to.not.exist();
        expect(flow._children).to.have.length(2);
        expect(flow._children[0].task).to.be.a.object();
        expect(flow._children[0].task._children).to.have.length(1);
        expect(flow._children[0].task._children[0].task).to.be.a.function();
        expect(flow._children[1].task).to.be.a.object();
        expect(flow._children[1].task._children).to.have.length(1);
        expect(flow._children[1].task._children[0].task).to.be.a.function();

        done();
    });

    it('creates (multi function) flow - `array []` notaiton', (done) => {

        const flow = Mercy.flow([internals.noop, internals.noop]);

        expect(flow.flow).to.not.exist();
        expect(flow._children).to.have.length(2);
        expect(flow._children[0].task).to.be.a.object();
        expect(flow._children[0].task._children).to.have.length(1);
        expect(flow._children[0].task._children[0].task).to.be.a.function();
        expect(flow._children[1].task).to.be.a.object();
        expect(flow._children[1].task._children).to.have.length(1);
        expect(flow._children[1].task._children[0].task).to.be.a.function();

        done();
    });

    it('creates (multi function) flow - `object {}` notaiton', (done) => {

        const flow = Mercy.flow({ foo: internals.noop, bar: internals.noop });

        expect(flow.flow).to.not.exist();
        expect(flow._children).to.have.length(2);
        expect(flow._children[0].label).to.equal('foo');
        expect(flow._children[0].task).to.be.a.object();
        expect(flow._children[0].task._children).to.have.length(1);
        expect(flow._children[0].task._children[0].task).to.be.a.function();
        expect(flow._children[1].label).to.equal('bar');
        expect(flow._children[1].task).to.be.a.object();
        expect(flow._children[1].task._children).to.have.length(1);
        expect(flow._children[1].task._children[0].task).to.be.a.function();

        done();
    });

    it('creates (multi function) flow - `object {}` notaiton w/ dependencies', (done) => {

        const flow = Mercy.flow({ foo: internals.noop, bar: ['foo', internals.noop] });

        expect(flow.flow).to.not.exist();
        expect(flow._children).to.have.length(2);
        expect(flow._children[0].label).to.equal('foo');
        expect(flow._children[0].task).to.be.a.object();
        expect(flow._children[0].task._children).to.have.length(1);
        expect(flow._children[0].task._children[0].task).to.be.a.function();
        expect(flow._children[1].label).to.equal('bar');
        expect(flow._children[1].depends).to.equal(['foo']);
        expect(flow._children[1].task).to.be.a.object();
        expect(flow._children[1].task._children).to.have.length(1);
        expect(flow._children[1].task._children[0].task).to.be.a.function();

        done();
    });

    it('creates (nested) flow - `array []` notaiton', (done) => {

        const flow = Mercy.flow([[internals.noop]]);

        expect(flow.flow).to.not.exist();
        expect(flow._children).to.have.length(1);
        expect(flow._children[0].task).to.be.a.object();
        expect(flow._children[0].task._children).to.have.length(1);
        expect(flow._children[0].task._children[0].task).to.be.a.object();
        expect(flow._children[0].task._children[0].task._children).to.have.length(1);
        expect(flow._children[0].task._children[0].task._children[0].task).to.be.a.function();

        done();
    });

    it('creates (nested) flow - `object {}` notaiton', (done) => {

        const flow = Mercy.flow({ foo: { bar: internals.noop } });

        expect(flow.flow).to.not.exist();
        expect(flow._children).to.have.length(1);
        expect(flow._children[0].label).to.equal('foo');
        expect(flow._children[0].task).to.be.a.object();
        expect(flow._children[0].task._children).to.have.length(1);
        expect(flow._children[0].task._children[0].label).to.equal('bar');
        expect(flow._children[0].task._children[0].task).to.be.a.object();
        expect(flow._children[0].task._children[0].task._children).to.have.length(1);
        expect(flow._children[0].task._children[0].task._children[0].task).to.be.a.function();

        done();
    });

    it('_executes flow (empty) ', (done) => {

        const flow = Mercy.flow();

        expect(flow.flow).to.not.exist();
        expect(flow._children).to.have.length(0);

        flow._execute((err, { meta, data, result }) => {

            expect(err).to.not.exist();
            expect(meta).to.be.an.object();
            expect(data).to.be.an.object();
            expect(result).to.be.undefined();

            expect(meta).to.be.an.object();
            expect(meta.bench).to.be.an.object();
            expect(meta.timer).to.be.an.object();
            expect(meta.bench).to.include(['start', 'end', 'duration']);
            expect(meta.timer).to.include(['start', 'end', 'duration']);

            done();
        });
    });

    it('_executes flow (single function)', (done) => {

        const flow = Mercy.flow(internals.noop);

        expect(flow.flow).to.not.exist();
        expect(flow._children).to.have.length(1);

        flow._execute((err, { meta, data, result }) => {

            expect(err).to.not.exist();
            expect(meta).to.be.an.object();
            expect(data).to.be.an.object();
            expect(result).to.be.undefined();

            expect(meta).to.be.an.object();
            expect(meta.bench).to.be.an.object();
            expect(meta.timer).to.be.an.object();
            expect(meta.bench).to.include(['start', 'end', 'duration']);
            expect(meta.timer).to.include(['start', 'end', 'duration']);

            done();
        });
    });

    it('_executes flow (single function) (single input)', (done) => {

        const flow = Mercy.flow((input, next) => { return next(null, input); });

        expect(flow.flow).to.not.exist();
        expect(flow._children).to.have.length(1);

        flow._execute('foobar', (err, { meta, data, result }) => {


            expect(err).to.not.exist();
            expect(meta).to.be.an.object();
            expect(data).to.be.an.object();
            expect(result).to.be.equal('foobar');

            done();
        });
    });

    it('_executes (single input) (single function) flow w/ final', (done) => {

        const flow = Mercy.flow(internals.noop).final((data, next) => {

            return next(null, 'foobar');
        });

        expect(flow.flow).to.not.exist();
        expect(flow._children).to.have.length(1);

        flow._execute((err, { meta, data, result }) => {

            expect(err).to.not.exist();
            expect(meta).to.be.an.object();
            expect(data).to.be.an.object();
            expect(result).to.equal('foobar');

            expect(meta).to.be.an.object();
            expect(meta.bench).to.be.an.object();
            expect(meta.timer).to.be.an.object();
            expect(meta.bench).to.include(['start', 'end', 'duration']);
            expect(meta.timer).to.include(['start', 'end', 'duration']);

            done();
        });
    });

    it('_executes (single function) flow w/ final', (done) => {

        const flow = Mercy.flow(internals.noop).final((data, next) => {

            return next(null, 'foobar');
        });

        expect(flow.flow).to.not.exist();
        expect(flow._children).to.have.length(1);

        flow._execute((err, { meta, data, result }) => {

            expect(err).to.not.exist();
            expect(meta).to.be.an.object();
            expect(data).to.be.an.object();
            expect(result).to.equal('foobar');

            expect(meta).to.be.an.object();
            expect(meta.bench).to.be.an.object();
            expect(meta.timer).to.be.an.object();
            expect(meta.bench).to.include(['start', 'end', 'duration']);
            expect(meta.timer).to.include(['start', 'end', 'duration']);

            done();
        });
    });

    it('Mercy.execute() (empty) flow', (done) => {

        const flow = Mercy.flow();

        Mercy.execute(flow, (err, meta, data, result) => {

            expect(err).to.not.exist();
            expect(meta).to.be.an.object();
            expect(data).to.be.an.object();
            expect(result).to.be.undefined();

            done();
        });
    });

    it('Mercy.execute() (single function) flow - `rest () notation`', (done) => {

        const flow = Mercy.flow(internals.noop);

        Mercy.execute(flow, (err, meta, data, result) => {

            expect(err).to.not.exist();
            expect(meta).to.be.an.object();
            expect(data).to.be.an.object();
            expect(result).to.be.undefined();

            done();
        });
    });

    it('Mercy.execute() (single function) flow w/ final', (done) => {

        const flow = Mercy.flow(internals.noop).final((data, next) => {

            return next(null, 'foobar');
        });

        Mercy.execute(flow, (err, meta, data, result) => {

            expect(err).to.not.exist();
            expect(meta).to.be.an.object();
            expect(data).to.be.an.object();
            expect(result).to.be.equal('foobar');

            done();
        });
    });

    it('Mercy.execute() (multi function) flow - `object {} notation`', (done) => {

        const flow = Mercy.flow({ foo: internals.noop, bar: internals.noop });

        Mercy.execute(flow, (err, meta, data, result) => {

            expect(err).to.not.exist();
            expect(meta).to.be.an.object();
            expect(data).to.be.an.object();
            expect(result).to.be.null();

            done();
        });
    });

    it('Mercy.execute() (multi function) flow w/ final', (done) => {

        const flow = Mercy.flow({
            foo: internals.noop,
            bar: internals.noop
        }).final((data, next) => {

            return next(null, data.foo.result);
        });

        Mercy.execute(flow, (err, meta, data, result) => {

            expect(err).to.not.exist();
            expect(meta).to.be.an.object();
            expect(data).to.be.an.object();
            expect(result).to.be.undefined();

            done();
        });
    });

    it('Mercy.execute() (multi dependent) flow', (done) => {

        const flow = Mercy.flow({
            foo: internals.noop,
            bar: internals.noop,
            foobar: ['foo', 'bar', Mercy.input()]
        }).final((data, next) => {

            return next(null, data.foobar.result);
        });

        Mercy.execute(flow, (err, meta, data, result) => {

            expect(err).to.not.exist();
            expect(meta).to.be.an.object();
            expect(data).to.be.an.object();
            expect(result).to.be.equal([ undefined, undefined ]);

            done();
        });
    });

    it('Mercy.execute() automatically converts to flow', (done) => {

        Mercy.execute(internals.noop, (err, meta, data, result) => {

            expect(err).to.not.exist();
            expect(meta).to.be.an.object();
            expect(data).to.be.an.object();
            expect(result).to.be.undefined();

            done();
        });
    });

    it('Mercy.execute() (nested) flow', (done) => {

        const flow = Mercy.flow({
            foo: internals.noop,
            bar: ['foo', Mercy.flow({ one: internals.noop })]
        });

        Mercy.execute(flow, (err, meta, data, result) => {

            expect(err).to.not.exist();
            expect(meta).to.be.an.object();
            expect(data).to.be.an.object();
            expect(result).to.be.null();

            done();
        });
    });

    it('Mercy.execute() (nested) flow w/ final', (done) => {

        const flow = Mercy.flow({
            foo: internals.noop,
            bar: ['foo', Mercy.flow({
                one: (data, next) => { return next(null, 'foobar'); }
            }).final((data, next) => {

                return next(null, data.one.result);
            })]
        }).final((data, next) => {

            return next(null, data.bar.result);
        });

        Mercy.execute(flow, (err, meta, data, result) => {

            expect(err).to.not.exist();
            expect(meta).to.be.an.object();
            expect(data).to.be.an.object();
            expect(result).to.equal('foobar');

            done();
        });
    });

    it('_input (single param) (single function)', (done) => {

        const flow = internals.echo;

        Mercy.execute('foobar', flow, (err, meta, data, result) => {

            expect(err).to.not.exist();
            expect(meta).to.be.an.object();
            expect(data).to.be.an.object();
            expect(result).to.equal('foobar');

            done();
        });
    });

    it('_input (multi param) (single function)', (done) => {

        const flow = (foo, bar, next) => { return next(null, [foo, bar]); };

        Mercy.execute('foo', 'bar', flow, (err, meta, data, result) => {

            expect(err).to.not.exist();
            expect(meta).to.be.an.object();
            expect(data).to.be.an.object();

            expect(result).to.equal(['foo', 'bar']);

            done();
        });
    });

    it('_input (single param) (nested function) - `object {} notation`', (done) => {

        const flow = Mercy.flow({
            foo: Mercy.input(),
            bar: ['foo', internals.echo]
        }).final((data, next) => {

            return next(null, data.bar.result);
        });

        Mercy.execute('foobar', flow, (err, meta, data, result) => {

            expect(err).to.not.exist();
            expect(meta).to.be.an.object();
            expect(data).to.be.an.object();
            expect(result).to.equal('foobar');

            done();
        });
    });

    it('_input (single param) (nested function) - `array [] notation`', (done) => {

        const flow = Mercy.flow([
            Mercy.input(),
            (input, next) => { return next(null, input); }
        ]);

        Mercy.execute('foobar', flow, (err, meta, data, result) => {

            expect(err).to.not.exist();
            expect(meta).to.be.an.object();
            expect(data).to.be.an.object();
            expect(result).to.equal('foobar');

            done();
        });
    });

    it('Mercy.input() (single param)', (done) => {

        const flow = Mercy.input();

        Mercy.execute('foobar', flow, (err, meta, data, result) => {

            expect(err).to.not.exist();
            expect(meta).to.be.an.object();
            expect(data).to.be.an.object();

            expect(result).to.equal('foobar');

            done();
        });
    });

    it('Mercy.input() (multi param)', (done) => {

        const flow = Mercy.input();

        Mercy.execute('foobar', flow, (err, meta, data, result) => {

            expect(err).to.not.exist();
            expect(meta).to.be.an.object();
            expect(data).to.be.an.object();

            expect(result).to.equal('foobar');

            done();
        });
    });

    it('Mercy.input() - array flow', (done) => {

        const flow = Mercy.flow([Mercy.input()]);

        Mercy.execute('foobar', flow, (err, meta, data, result) => {

            expect(err).to.not.exist();
            expect(meta).to.be.an.object();
            expect(data).to.be.an.object();
            expect(result).to.equal('foobar');

            done();
        });
    });

    it('Mercy.input() - object flow', (done) => {

        const flow = Mercy.flow({ in: Mercy.input() }).final((data, next) => {

            return next(null, data.in.result);
        });

        Mercy.execute('foobar', flow, (err, meta, data, result) => {

            expect(err).to.not.exist();
            expect(meta).to.be.an.object();
            expect(data).to.be.an.object();
            expect(result).to.equal('foobar');

            done();
        });
    });

    it('Mercy.input() flows accept dependencies as input', (done) => {

        const flow = Mercy.flow({
            input: Mercy.input(),
            foo: ['input', Mercy.input()]
        }).final((data, next) => {

            return next(null, data.foo.result);
        });

        Mercy.execute('foobar', flow, (err, meta, data, result) => {

            expect(err).to.not.exist();
            expect(meta).to.be.an.object();
            expect(data).to.be.an.object();
            expect(result).to.equal('foobar');

            done();
        });
    });

    it('Mercy.input() nested flows accept dependencies as input', (done) => {

        const inner = Mercy.flow({
            bar: Mercy.input()
        }).final((data, next) => {

            return next(null, data.bar.result);
        });

        const flow = Mercy.flow({
            input: Mercy.input(),
            foo: ['input', inner]
        }).final((data, next) => {

            return next(null, data.foo.result);
        });

        Mercy.execute('foobar', flow, (err, meta, data, result) => {

            expect(err).to.not.exist();
            expect(meta).to.be.an.object();
            expect(data).to.be.an.object();
            expect(result).to.equal('foobar');

            done();
        });
    });

    it('flow().final() can set _final', (done) => {

        const task = (data, next) => { return next(); };
        const flow = Mercy.flow().final(task);

        expect(flow._final).to.equal(task);
        expect(flow._children).to.have.length(0);

        done();
    });

    it('flow().final() doesn\'t overwrite task\'s', (done) => {

        const task = (data, next) => { return next(); };
        const flow = Mercy.flow(internals.noop).final(task);

        expect(flow._final).to.equal(task);
        expect(flow._children).to.have.length(1);

        done();
    });

    it('flow().wait()', (done) => {

        const flow = Mercy.flow().wait(32);

        Mercy.execute(flow, (err, meta, data, result) => {

            expect(err).to.not.exist();
            expect(result).to.be.undefined();
            expect(meta.bench.duration).to.be.at.least(32);
            expect(meta.timer.duration).to.be.at.least(32);

            done();
        });
    });

    it('Mercy.wait()', (done) => {

        const flow = Mercy.wait(32);

        Mercy.execute(flow, (err, meta, data, result) => {

            expect(err).to.not.exist();
            expect(result).to.be.equal(32);
            expect(meta.bench.duration).to.be.at.least(32);
            expect(meta.timer.duration).to.be.at.least(32);

            done();
        });
    });

    it('flow().timeout()', (done) => {

        const flow = Mercy.flow(Mercy.wait(32), Mercy.wait(32)).timeout(1);

        Mercy.execute(flow, (err, meta, data, result) => {

            expect(err).to.exist();
            expect(result).to.be.an.error();
            expect(result).to.be.an.equal(err);

            done();
        });
    });

    it('flow().timeout() parent overrides children', (done) => {

        const flow = Mercy.flow().timeout(1000).tasks([
            Mercy.wait(500).timeout(600),
            Mercy.flow().series().tasks([
                Mercy.wait(2000),           // runs... on interruption, waits for completion of current task.
                Mercy.wait(2000)            // oops cant keep going (series)... exit out; parent timeout occurred;
            ])
        ]);

        Mercy.execute(flow, (err, meta, data, result) => {

            expect(err).to.exist();
            expect(result).to.be.an.error(Error, 'Flow timeout of 1000(ms) occurred');

            done();
        });
    });

    it('flow().optional()', (done) => {

        const flow = Mercy.flow(Mercy.wait(32), Mercy.wait(32)).timeout(1).optional();

        Mercy.execute(flow, (err, meta, data, result) => {

            expect(err).to.not.exist();
            expect(result).to.equal(32);

            done();
        });
    });

    it('flow().series()', (done) => {

        const flow = Mercy.flow(Mercy.wait(32), Mercy.wait(32)).series();

        expect(flow._style).to.equal('series');

        Mercy.execute(flow, (err, meta, data, result) => {

            expect(err).to.not.exist();
            expect(result).to.equal(32);
            expect(meta.bench.duration).to.be.at.least(64);
            expect(meta.timer.duration).to.be.at.least(64);

            done();
        });
    });

    it('flow().parallel()', (done) => {

        const flow = Mercy.flow(Mercy.wait(32), Mercy.wait(32)).parallel();

        expect(flow._style).to.equal('parallel');

        Mercy.execute(flow, (err, meta, data, result) => {

            expect(err).to.not.exist();
            expect(result).to.equal(null)
            expect(meta.bench.duration).to.be.between(32, 64);
            expect(meta.timer.duration).to.be.between(32, 64);

            done();
        });
    });

    it('flow().retry()', (done) => {

        let count = 0;
        const opts = { times: 3, interval: 64 };

        const flow = Mercy.flow((data, next) => {

            return next(new Error(`Count: ${++count}`));
        }).retry(opts);

        Mercy.execute(flow, (err, meta, data, result) => {

            expect(err).to.exist();
            expect(count).to.equal(opts.times);
            expect(result).to.be.an.equal(err);
            expect(result).to.be.an.error();

            done();
        });
    });

    it('flow().tasks()', (done) => {

        const flow = Mercy.flow().tasks(internals.noop);

        Mercy.execute(flow, (err, meta, data, result) => {

            expect(err).to.not.exist();
            expect(flow._children).to.have.length(1);
            expect(result).to.be.undefined();

            done();
        });
    });

    it('clone() tasks', (done) => {

        const foo = Mercy.flow({ noop: internals.noop });
        const bar = foo.tasks({ noop2: internals.noop });

        expect(foo._children.pop().label).to.equal('noop');
        expect(bar._children.pop().label).to.equal('noop2');

        done();
    });

    it('clone() series', (done) => {

        const foo = Mercy.flow({ noop: internals.noop });
        const bar = foo.series();

        Code.settings.comparePrototypes = true;

        expect(foo).to.not.equal(bar);
        expect(foo._style).to.equal('parallel');
        expect(bar._style).to.equal('series');

        Code.settings.comparePrototypes = false;

        done();
    });

    it('clone() parallel', (done) => {

        const foo = Mercy.flow(internals.noop);
        const bar = foo.parallel();

        Code.settings.comparePrototypes = true;

        expect(foo).to.not.equal(bar);
        expect(foo._style).to.equal('series');
        expect(bar._style).to.equal('parallel');

        Code.settings.comparePrototypes = false;

        done();
    });

    it('clone() auto', (done) => {

        const foo = Mercy.flow(internals.noop);
        const bar = foo.auto();

        Code.settings.comparePrototypes = true;

        expect(foo).to.not.equal(bar);
        expect(foo._style).to.equal('series');
        expect(bar._style).to.equal('auto');

        Code.settings.comparePrototypes = false;

        done();
    });

    it('clone() series - fails with dependencies', (done) => {

        const foo = Mercy.flow({ noop: internals.noop, noop2: ['noop', internals.noop] });
        expect(foo._style).to.equal('auto');
        expect(foo.series).to.throw();

        done();
    });

    it('clone() parallel - fails with dependencies', (done) => {

        const foo = Mercy.flow({ noop: internals.noop, noop2: ['noop', internals.noop] });
        expect(foo._style).to.equal('auto');
        expect(foo.parallel).to.throw();

        done();
    });

    it('clone() required', (done) => {

        const foo = Mercy.flow(internals.noop);
        const bar = foo.optional().required();

        Code.settings.comparePrototypes = true;

        expect(foo).to.equal(bar);
        expect(bar._settings.optional).to.be.false();

        Code.settings.comparePrototypes = false;

        done();
    });

    it('clone() optional', (done) => {

        const foo = Mercy.flow(internals.noop);
        const bar = foo.optional();

        Code.settings.comparePrototypes = true;

        expect(foo).to.not.equal(bar);
        expect(foo._settings.optional).to.be.false();
        expect(bar._settings.optional).to.be.true();

        Code.settings.comparePrototypes = false;

        done();
    });

    it('clone() retry', (done) => {

        const opts = { times: 3, interval: 256 };
        const foo = Mercy.flow(internals.noop);
        const bar = foo.retry(opts);

        Code.settings.comparePrototypes = true;

        expect(foo).to.not.equal(bar);
        expect(foo._settings.retry).to.be.null();
        expect(bar._settings.retry).to.equal(opts);

        Code.settings.comparePrototypes = false;

        done();
    });

    it('clone() final', (done) => {

        const final1 = (value, next) => { return next(null, 'foo'); };
        const final2 = (value, next) => { return next(null, 'bar'); };

        const foo = Mercy.flow(internals.noop).final(final1);
        const bar = foo.final(final2);

        Code.settings.comparePrototypes = true;

        expect(foo).to.not.equal(bar);
        expect(foo._final).to.equal(final1);
        expect(bar._final).to.equal(final2);

        Code.settings.comparePrototypes = false;

        done();
    });

    it('Mercy.compose()', (done) => {

        const manifest = require('./cfg/basic');
        const flow = Mercy.compose(manifest);

        Mercy.execute(flow, (err, meta, data, result) => {

            expect(err).to.not.exist();
            expect(result.info.created).to.be.above(0);
            expect(result.info.started).to.equal(0);
        });

        done();
    });

    it('Mercy.start()', (done) => {

        const manifest = require('./cfg/basic');
        const flow = Mercy.flow([
            Mercy.compose(manifest),
            Mercy.start()
        ]);

        Mercy.execute(flow, (err, meta, data, result) => {

            expect(err).to.not.exist();
            expect(result.info.created).to.be.above(0);
            expect(result.info.started).to.be.above(0);
        });

        done();
    });

    it('Mercy.stop()', (done) => {

        const manifest = require('./cfg/basic');
        const flow = Mercy.flow([
            Mercy.compose(manifest),
            Mercy.start().final((server, next) => {

                expect(server.info.started).to.be.above(0);
                return next(null, server);
            }),
            Mercy.stop()
        ]);

        Mercy.execute(flow, (err, meta, data, result) => {

            expect(err).to.not.exist();
            expect(result.info.created).to.be.above(0);
            expect(result.info.started).to.equal(0);
        });

        done();
    });

    it('Mercy.prepare()', (done) => {

        const manifest = require('./cfg/basic');
        const flow = Mercy.prepare(manifest);

        Mercy.execute(flow, (err, meta, data, result) => {

            expect(err).to.not.exist();
            expect(result.info.created).to.be.above(0);
            expect(result.info.started).to.be.above(0);
        });

        done();
    });

    it('Mercy.validate()', (done) => {

        const schema = Joi.number();
        const flow = Mercy.validate(schema);

        Mercy.execute(32, flow, (err, meta, data, result) => {

            expect(err).to.not.exist();
            expect(result).to.equal(32);
        });

        done();
    });

    it('Mercy.input(schema)', (done) => {

        const schema = Joi.number();
        const flow = Mercy.input(schema);

        Mercy.execute(32, flow, (err, meta, data, result) => {

            expect(err).to.not.exist();
            expect(result).to.equal(32);
        });

        done();
    });

    it('Mercy.transform()', (done) => {

        const source = {
            address: {
                one: '123 main street',
                two: 'PO Box 1234'
            },
            title: 'Warehouse',
            state: 'CA'
        };

        const template = {
            'person.address.lineOne': 'address.one',
            'person.address.lineTwo': 'address.two',
            'title': 'title',
            'person.address.region': 'state'
        };

        const flow = Mercy.transform(template);

        Mercy.execute(source, flow, (err, meta, data, result) => {

            expect(err).to.not.exist();
            expect(result).to.equal({
                title: 'Warehouse',
                person: {
                    address: {
                        lineOne: '123 main street',
                        lineTwo: 'PO Box 1234',
                        region: 'CA'
                    }
                }
            });
        });

        done();
    });


    // TODO:
    // flow.tree()

    // implement memory usage anaytics

    // 1) Cloning when method chaining
    // 2) Add flow.tasks()
    // 3) Add Mercy.validate()
    // 3.1) Hoek.transform()
    // 4) Enhance Mercy.input(schema)
        // Shorthand for input validation
    // 9) Mercy.inject()
    // 10) Mercy.wreck()
        // Mercy.wreck().defaults()
        // Need to consider how all options will work
        // Might we want to automatically feed data into it?
    // 11) Mercy.mock()
        // Nock setup specifically for server. Might want to combine with Mercy.prepare()?

});
