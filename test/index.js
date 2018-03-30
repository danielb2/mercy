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

        Code.settings.comparePrototypes = true;

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


    // TODO:
    // flow.tree()

    // implement memory usage anaytics

    // 1) Cloning when method chaining
    // 2) Add flow.tasks()
    // 3) Add Mercy.validate()
    // 3.1) Hoek.transform()
    // 4) Enhance Mercy.input(schema)
        // Shorthand for input validation
    // 5) Mercy.compose()
    // 6) Mercy.start()
    // 7) Mercy.stop()
    // 8) Mercy.prepare() (compose + start)
    // 9) Mercy.inject()
    // 10) Mercy.wreck()
        // Mercy.wreck().defaults()
        // Need to consider how all options will work
        // Might we want to automatically feed data into it?
    // 11) Mercy.mock()
        // Nock setup specifically for server. Might want to combine with Mercy.prepare()?


    // it('can prepare', (done) => {
    //
    //     const manifest = require('./cfg/basic');
    //     // const flow = Mercy.prepare({ manifest });
    //
    //     // const flow = Mercy.flow({ one: 'two' });
    //     const flow = Mercy.flow('label', 'deps', () => {});
    //
    //
    //     Mercy.execute(flow, (err, meta, result) => {
    //
    //         expect(meta).to.exist();
    //         expect(result).to.exist();
    //         // expect(result.manifest).to.exist();
    //         // expect(result.settings).to.exist();
    //         // expect(result.server).to.exist();
    //
    //         done();
    //     });
    // });

    // it('can prepare', (done) => {
    //
    //     const mercy = Mercy.prepare();
    //
    //     expect(mercy._server).to.equal(null);
    //     expect(mercy._settings).to.be.an.object();
    //     expect(mercy._tasks).to.have.length(1);
    //
    //     done();
    // });
    //
    // it('loads a basic manifest', (done) => {
    //
    //     const manifest = require('./cfg/basic');
    //     const mercy = Mercy.prepare(manifest);
    //
    //     expect(mercy._settings).to.exist();
    //     expect(mercy._settings.manifest).to.be.an.object();
    //
    //     done();
    // });
    //
    // it('loads basic preConnections', (done) => {
    //
    //     const manifest = require('./cfg/basic');
    //     const options = { preConnections: (server, next) => { return next(); } };
    //
    //     Mercy.prepare(manifest, options).final((err, data) => {
    //
    //         expect(err).to.not.exist();
    //
    //         expect(data.prepare.result.server).to.be.an.object();
    //         expect(data.prepare.result.settings).to.be.an.object();
    //
    //         done()
    //     });
    // });
    //
    // it('loads basic preRegister', (done) => {
    //
    //     const manifest = require('./cfg/basic');
    //     const options = { preRegister: internals.preRegister };
    //
    //     Mercy.prepare(manifest, options).final((err, data) => {
    //
    //         expect(err).to.not.exist();
    //
    //         expect(data.prepare.result.server).to.be.an.object();
    //         expect(data.prepare.result.settings).to.be.an.object();
    //
    //         done()
    //     });
    // });
    //
    // it('performs minimal flow', (done) => {
    //
    //     const manifest = require('./cfg/basic');
    //
    //     Mercy.prepare(manifest).final((err, data) => {
    //
    //         expect(err).to.not.exist();
    //
    //         expect(data.prepare.result.server).to.be.an.object();
    //         expect(data.prepare.result.settings).to.be.an.object();
    //
    //         done()
    //     });
    // });
    //
    // it('performs simple injection', (done) => {
    //
    //     Mercy.prepare()
    //         // .inject('/')
    //         .inject('l1', 'd1', 'd2', '/')
    //         .inject('l1', '', '/')
    //         .final((err, data) => {
    //
    //             expect(err).to.not.exist();
    //
    //             expect(data.prepare.result).to.be.an.object();
    //             expect(data['task_0'].result.statusCode).to.equal(404);
    //
    //             done();
    //         });
    // });
    //
    // it('performs simple injections (automatic labels)', (done) => {
    //
    //     Mercy.prepare()
    //         .inject('label1', '/')              // label1 is label
    //         .inject('label1', '/foo')           // dependecy detected
    //         .inject({ label: 'label1', ... })   // label1 conflict with first
    //         .final((err, data) => {
    //
    //             expect(err).to.not.exist();
    //
    //             expect(data.prepare.result).to.be.an.object();
    //             expect(data['task_0'].result.statusCode).to.equal(404);
    //             expect(data['task_1'].result.statusCode).to.equal(404);
    //
    //             done();
    //         });
    // });
    //
    // it('performs simple injection (specific labels)', (done) => {
    //
    //     Mercy.prepare()
    //         .inject('test', '/')
    //         .final((err, data) => {
    //
    //             expect(err).to.not.exist();
    //
    //             expect(data.prepare.result).to.be.an.object();
    //             expect(data.test.result.statusCode).to.equal(404);
    //
    //             done();
    //         });
    // });
    //
    // it('rejects simple injection (conflict labels)', (done) => {
    //
    //     Mercy.prepare()
    //         .inject('test', '/')
    //         .inject('test', '/')
    //         .final((err, data) => {
    //
    //             expect(err).to.exist();
    //             expect(data.prepare.result).to.be.an.object();
    //
    //             done();
    //         });
    // });
    //
    // it('performs injection with options', (done) => {
    //
    //     Mercy.prepare()
    //         .inject('test', { endpoint: '/' })
    //         .final((err, data) => {
    //
    //             expect(err).to.not.exist();
    //
    //             expect(data.prepare.result).to.be.an.object();
    //             expect(data.test.result.statusCode).to.equal(404);
    //
    //             done();
    //         });
    // });
    //
    //
    // it('allows custom joi validation', (done) => {
    //
    //     const manifest = require('./cfg/basic');
    //
    //     Mercy.prepare(manifest).final((err, data) => {
    //
    //         expect(err).to.not.exist();
    //
    //         done()
    //     });
    // });

    // it('loads basic preConnection', (done) => {
    //
    //     const manifest = require('./cfg/base');
    //     const options = { preConnection: internals.preConnection };
    //
    //     Insync.auto({
    //         prepare: Mercy.prepare(manifest, options)
    //     }, (err, data) => {
    //
    //         expect(err).to.not.exist();
    //
    //         expect(data.prepare.result.server).to.exist();
    //         expect(data.prepare.result.settings).to.exist();
    //
    //         done();
    //     });
    // });
    //
    // it('loads basic preRegister', (done) => {
    //
    //     const manifest = require('./cfg/base');
    //     const options = { preRegister: internals.preRegister };
    //
    //     Insync.auto({
    //         prepare: Mercy.prepare(manifest, options)
    //     }, (err, data) => {
    //
    //         expect(err).to.not.exist();
    //
    //         expect(data.prepare.result.server).to.exist();
    //         expect(data.prepare.result.settings).to.exist();
    //
    //         done();
    //     });
    // });
    //
    // it('performs injection', (done) => {
    //
    //     const manifest = require('./cfg/base');
    //     const options = { preRegister: internals.preRegister };
    //     const endpoint = { method: 'GET', url: '/status' };
    //
    //     Insync.auto({
    //         prepare: Mercy.prepare(manifest, options),
    //         checkup: ['prepare', Mercy.inject(endpoint)]
    //     }, (err, data) => {
    //
    //         expect(err).to.not.exist();
    //         expect(data.checkup.res.result).to.equal({ status: 'ok' });
    //
    //         done();
    //     });
    // });
    //
    // it('performs injection', (done) => {
    //
    //     const manifest = require('./cfg/base');
    //     const options = { preRegister: internals.preRegister };
    //     const endpoint = {
    //         method: 'GET',
    //         url: '/status',
    //         headers: { foo: 'bar', cookie: 'foo=bar;' }
    //     };
    //
    //     const endpoint = { method, path, payload, ... };
    //     const extract = {
    //         headersFrom: ['label1', 'label2'],    // performs a fold left merge request.headers (occurs prior to )
    //         cookiesFrom: ['label4']     // performs a fold left merge of res['set-cookies'] values.
    //     };
    //
    //     // Method chaining
    //     // - alias (label, key, name)
    //     Mercy.prepare(manifest, options)
    //         .inject({ label: 'one', { endpoint, extract } })
    //         .inject({ label: 'two',   depends: ['one'], { endpoint, extract } })
    //         .inject({ label: 'three', depends: ['two'], { endpoint, extract } })
    //         .inject({ label: 'four',  depends: ['one', 'two'], { endpoint, extract } })
    //         .final((err, data) => {
    //
    //             expect(err).to.not.exist();
    //             expect(data.checkup.result.server).to.exist();
    //             done();
    //         });
    //
    //     // Method chaining v2 (preferred)
    //     Mercy.prepare(manifest, options)
    //         .inject('one', { endpoint, extract })
    //         .inject('two', ['one'], { endpoint, extract })
    //         .inject('two', ['one'], { endpoint, extract })
    //         .inject('three', ['two'], { endpoint, extract })
    //         .inject('four', ['two', 'three'], { endpoint, extract })
    //         .final((err, data) => {
    //
    //             expect(err).to.not.exist();
    //             expect(data.checkup.result.server).to.exist();
    //             done();
    //         });
    //
    //
    //     // Async/Insync Auto()
    //     const mercy = Mercy.prepare(manifest, options)
    //     Insync.auto({
    //         one:    mercy.inject(endpoint, extract),
    //         two:   ['one', mercy.inject(endpoint, extract)],
    //         three: ['two', mercy.inject(endpoint, extract)],
    //         four:  ['one', 'two', mercy.inject(endpoint, extract)]
    //     }, (err, data) => {
    //
    //         expect(err).to.not.exist();
    //         expect(data.checkup.result.server).to.exist();
    //         done();
    //     });
    // });
    //

    // it('fooooooobaaar', (done) => {
    //
    //     const manifest = require('./cfg/base');
    //     const options = { preRegister: internals.preRegister };
    //     const endpoint = { method: 'GET', url: '/status', headers: { foo: 'bar' } };
    //     //
    //     // const options = {
    //     //     headersFrom: ['checkup', 'foo', 'bar'],
    //     //     setCookieFrom: ['foo', 'bar',]
    //     // }
    //
    //     Insync.auto({
    //         prepare: Mercy.prepare(manifest, options),
    //         checkup: ['prepare', Mercy.inject(endpoint)],
    //         foo:     ['prepare', Mercy.inject(endpoint)],
    //         bar:     ['prepare', Mercy.inject(endpoint)],
    //         foobar:  ['prepare', Mercy.inject(endpoint, options)],
    //     }, (err, data) => {
    //
    //         expect(err).to.not.exist();
    //
    //         expect(data.checkup.result.server).to.exist();
    //
    //         done();
    //     });
    // });



    //
    // it('loads a base server', (done) => {
    //
    //     // Dynamically load new plugin with test route
    //
    //     const mock = {
    //         rotues: [
    //             {
    //                 method: '*',
    //                 path: '/cart/{p*}',
    //                 response: [
    //                     require('./mock/foobar')
    //                 ]
    //             }
    //         ]
    //     };
    //
    //
    //     Insync.auto({
    //         upstream: Mercy.prepare(),
    //         server:   Mercy.prepare(manifest),
    //         inject:   ['server, upstream', Mercy.inject()]
    //     }, (err, data) => {
    //
    //         expect(err).to.not.exist();
    //
    //         // Validate output
    //         const statusCode = data.signup.res.statusCode;
    //         const cookies = data.signup.res.headers['set-cookie'];
    //         const payload = data.signup.res.result;
    //
    //         expect(statusCode).to.equal(200);
    //         expect(cookies).to.match(/yaht=Fe26/);
    //         expect(payload).to.equal({ status: 'ok' });
    //
    //         done();
    //     });
    // });
    //
    // it('returns 200', (done) => {
    //
    //     const server = new Hapi.Server();
    //     server.connection();
    //
    //     const plugin = { register: internals.plugins.heartbeat };
    //     server.register(plugin, (err) => {
    //
    //         expect(err).to.not.exist();
    //         server.start((err) => {
    //
    //             expect(err).to.not.exist();
    //             server.inject('/heartbeat', (res) => {
    //
    //                 expect(res.statusCode).to.equal(200);
    //                 expect(res.result).to.equal({ status: 'ok' });
    //                 done();
    //             });
    //         });
    //     });
    // });
    //
    // it('throws with bad configuration', (done) => {
    //
    //     const server = new Hapi.Server();
    //     server.connection();
    //
    //     const plugin = {
    //         register: internals.plugins.heartbeat,
    //         options: { bad: 'configuration' }
    //     };
    //
    //     server.register(plugin, (err) => {
    //
    //         expect(err).to.exist();
    //         expect(err.message).to.equal('"bad" is not allowed');
    //         done();
    //     });
    // });
    //
    // it('set a custom path', (done) => {
    //
    //     const server = new Hapi.Server();
    //     server.connection();
    //
    //     const plugin = {
    //         register: internals.plugins.heartbeat,
    //         options: { path: '/custom/path' }
    //     };
    //
    //
    //     server.register(plugin, (err) => {
    //
    //         expect(err).to.not.exist();
    //         server.start((err) => {
    //
    //             expect(err).to.not.exist();
    //             server.inject(plugin.options.path, (res) => {
    //
    //                 expect(res.statusCode).to.equal(200);
    //                 expect(res.result).to.equal({ status: 'ok' });
    //                 done();
    //             });
    //         });
    //     });
    // });
    //
    // it('set a custom message', (done) => {
    //
    //     const server = new Hapi.Server();
    //     server.connection();
    //
    //     const plugin = {
    //         register: internals.plugins.heartbeat,
    //         options: { message: { custom: 'message' } }
    //     };
    //
    //     server.register(plugin, (err) => {
    //
    //         expect(err).to.not.exist();
    //         server.start((err) => {
    //
    //             expect(err).to.not.exist();
    //             server.inject('/heartbeat', (res) => {
    //
    //                 expect(res.statusCode).to.equal(200);
    //                 expect(res.result).to.equal(plugin.options.message);
    //                 done();
    //             });
    //         });
    //     });
    // });
});
