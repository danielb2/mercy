'use strict';

// Load modules

const Async = require('async');
const Hoek = require('hoek');
const Joi = require('joi');

const Any = require('./any');
const Timer = require('../timer');


// Declare internals

const internals = {
    final: {
        auto: (data, next) => { return next(null, null); },
        parallel: (data, next) => { return next(null, null); },
        series: (value, next) => { return next(null, value); }
    }
};


module.exports = internals.Flow = class extends Any {

    constructor (tasks) {

        super();

        this._type = 'flow';
        this._style = null;
        this._children = [];
        this._final = null;
        this._settings = {
            internval: 0,
            optional: false,
            retry: null,
            skip: false,
            timeout: 0,
            wait: 0
        };

        // Base case (empty)
        if (!tasks) {
            this._style = 'series';
            return this;
        }

        // Base case (function)
        if (typeof tasks === 'function') {
            this._style = 'series';
            this._children.push({ label: null, depends: [], task: tasks });

            return this;
        }

        // Base case (Mercy object)
        if (typeof tasks === 'object' && tasks._isMercy) {
            return tasks;
        }

        // Iterate Array. Recurse when necessary.
        if (Array.isArray(tasks)) {
            this._style = 'series';

            for (let i = 0; i < tasks.length; ++i) {
                this._children.push({ label: null, depends: [], task: new internals.Flow(tasks[i]) });
            }

            return this;
        }

        // Iterate object. Recurse when necessary.
        if (!Array.isArray(tasks) && typeof tasks === 'object') {
            this._style = 'parallel';

            for (let key in tasks) {
                if (tasks.hasOwnProperty(key)) {
                    const item = tasks[key];
                    const value = Array.isArray(item) ? item : [item];

                    this._children.push({
                        label: key,
                        depends: (value.length > 1) ? value.slice(0, -1) : [],
                        task: new internals.Flow(value.slice(-1).pop())
                    });
                }
            }

            for (let i = 0; i < this._children.length; ++i) {
                const child = this._children[i];

                if (child.depends.length) {
                    this._style = 'auto';
                }
            }

            return this;
        }

        return this;
    }

    clone () {

        const obj = Object.create(Object.getPrototypeOf(this));

        obj._isMercy = true;
        obj._type = this._type;
        obj._style = this._style;
        obj._children = this._children.slice();
        obj._final = this._final;
        obj._settings = Hoek.clone(this._settings);

        return obj;
    }

    _execute (...args) {

        let tasks = [];
        const callback = Hoek.once(args.pop());

        // if (this.settings._skip) {
        //     return callback(null, { meta, data, result });
        // }

        // _meta - default always
        const pre = ['_meta'];
        const _meta = (next) => {

            const meta = {
                bench: { start: new Hoek.Bench(), end: null, duration: null },
                timer: { start: new Hoek.Timer(), end: null, duration: null },
                settings: this._settings
            };

            return next(null, meta);
        };

        tasks.push({ _meta });

        // _wait - Mercy.flow().wait()
        if (this._settings.wait) {
            const _wait = (data, next) => {

                const timer = setTimeout(() => {

                    console.log(this._settings.wait);

                    return next(null, this._settings.wait);
                }, this._settings.wait);
            };

            tasks.push({ _wait: [...pre, _wait] });
            pre.push('_wait');
        }

        // _timeout - Mercy.flow().timeout()
        if (this._settings.timeout) {

            const _timeout = (data, next) => {

                const timeout = this._settings.timeout
                const obj = (typeof timeout === 'object');
                const duration = obj ? timeout.remaining() : timeout;

                const timer = obj ? timeout : new Timer(() => {

                    // Mercy.optional()
                    const optional = this._settings.optional;

                    if (!optional) {
                        const err = new Error(`Flow timeout of ${duration}(ms) occurred`);
                        return callback(err, { meta: data['_meta'], data, result: err });
                    }
                }, duration);

                return next(null, { duration, timer });
            };

            tasks.push({ _timeout: [...pre, _timeout] });
            pre.push('_timeout');
        }

        // _input - Mercy.input()
        tasks.push({ _input: [...pre, (data, next) => { return next(null, [...args]); }] });
        pre.push('_input');

        // Add flow's tasks
        // Series flow's always cascade input
        const series = (this._style === 'series');

        for (let i = 0; i < this._children.length; ++i) {
            const child = this._children[i];

            // Mercy.input() - Autoinject `_input`
            // Mercy.series() - Occurs no dependencies listed (`Rest ()` & `Array []` notation)
            // Here, for dev convenience, we automatically set dependencies and injection
            const input = (child.task._type === 'input' && !child.depends.length) ? ['_input'] : [];

            const last = series ? [Object.keys(tasks.slice(-1).pop()).pop()] : [];

            const label = child.label || `task_${i}`;
            const depends = series ? Hoek.unique([...pre, ...last]) : Hoek.unique([...pre, ...input, ...child.depends]);
            const inject = series ? Hoek.unique([...last, ...input]) : [...input, ...child.depends];

            const task = {};
            task[`${label}`] = [...depends, internals.wrap(inject, child.task)];

            tasks.push(task);
        }

        // Transform to async tasks
        const build = [{}, ...tasks].reduce((acc, cur) => { return Hoek.merge(acc, cur); });

        // Add _final async task
        const last = Object.keys(tasks.slice(-1).pop()).pop();
        const depends = series ? Hoek.unique([...pre, last]) : Object.keys(build);
        const inject = series ? [last] : [];

        build['_final'] = [...depends, internals.wrap(inject, this._final || internals.final[this._style])];

        console.log(this._type);
        console.log(this._style);
        console.log(inject);
        console.log(build);
        console.log();

        // Execute build
        const retry = this._settings.retry;
        const run = retry ? Async.retryable(retry, internals.execute) : internals.execute;

        run(build, (err, result) => { return callback(err, result) });
    }

    // Flow style

    series () {

        for (let i = 0; i < this._children.length; ++i) {
            const child = this._children[i];
            Hoek.assert(!child.depends.length, `Cannot convert style to Series. Child task ${child.label} has dependency ${child.depends}`);
        }

        const flow = this.clone();
        flow._style = 'series';

        return flow;
    }

    parallel () {

        for (let i = 0; i < this._children.length; ++i) {
            const child = this._children[i];
            Hoek.assert(!child.depends.length, `Cannot convert style to Parallel. Child task ${child.label} has dependency ${child.depends}`);
        }

        const flow = this.clone();
        flow._style = 'parallel';

        return flow;
    }

    auto () {

        const flow = this.clone();
        flow._style = 'auto';

        return flow;
    }

    cargo(workers) {}

    // Flow Options

    skip () {

        const flow = this.clone();
        flow._settings.skip = true;

        return flow;
    }

    retry (...args) {

        const flow = this.clone();
        flow._settings.retry = args.pop();

        return flow;
    }

    required () {

        const flow = this.clone();
        flow._settings.optional = false;

        return flow;
    }

    optional () {

        const flow = this.clone();
        flow._settings.optional = true;

        return flow;
    }

    timeout (...args) {

        const schema = Joi.alternatives().try([
            Joi.number().integer().positive().allow(0),
            Joi.object()
        ]);

        const input = Joi.validate(args.pop(), schema);
        Hoek.assert(!input.error, input.error && input.error.annotate());

        const flow = this.clone();
        flow._settings.timeout = input.value;

        return flow;
    }

    wait (...args) {

        const schema = Joi.number().integer().positive().allow(0);
        const input = Joi.validate(args.pop(), schema);
        Hoek.assert(!input.error, input.error && input.error.annotate());

        const flow = this.clone();
        flow._settings.wait = input.value;

        return flow;
    }

    final (callback) {

        const flow = this.clone();
        flow._final = callback;

        return flow;
    }

    tasks (...args) {

        const input = (args.length === 1) ? args.pop() : args;

        const schema = Joi.array().single().items([
            Joi.func().minArity(1),
            Joi.object().unknown(),
            Joi.array().items(Joi.lazy(() => schema))
        ]);

        const tasks = Joi.validate(input, schema);
        Hoek.assert(!tasks.error, tasks.error && tasks.error.annotate());

        const flow = this.clone();
        const temp = new internals.Flow((tasks.value.length > 1) ? tasks.value : tasks.value.pop());
        flow._children = temp._children.slice();

        return flow;
    }

    tree () {}
};


internals.wrap = function (inject, task) {

    const isMercy = task._isMercy;

    return (data, next) => {

        let input = inject.length ? [] : [data];
        const meta = data['_meta'];

        // Mercy.timeout() - Parent timeout can override child
        if (isMercy) {
            const curr = Hoek.reach(data, '_timeout.timer');

            if (curr) {
                const child = task._settings.timeout;
                const remaining = curr.remaining();
                const timeout = (!child || (child > remaining)) ? curr : child;
                task = task.timeout(timeout);
            }
        }

        // Inject is adaptive. Uses either (raw function or Mercy) result.
        for (let i = 0; i < inject.length; ++i) {
            const item = inject[i];

            // `_input` - injection depmands spreading (ex: series flows && Merct.Input())
            if (item === '_input') {
                input = data['_input'].length ? [...input, ...data[item]] : [...input, undefined];
            }
            else {
                input.push(Hoek.reach(data[item], 'result', { default: data[item] }));
            }
        }

        const params = [...input, (err, result) => { return next(err, result) }];

        // console.log({ inject });
        // console.log({ params });

        return isMercy ? task._execute(...params) : task(...params);
    };
};


internals.execute = function (build, callback) {

    Async.auto(build, (err, data) => {

        // _timeout - Mercy.timeout()
        clearTimeout(Hoek.reach(data['_timeout'], 'timer'));

        // Metrics
        const meta = data['_meta'];
        meta.bench.end = new Hoek.Bench();
        meta.timer.end = new Hoek.Timer();
        meta.bench.duration = meta.bench.start.elapsed();
        meta.timer.duration = meta.timer.start.elapsed();

        const result = Hoek.reach(data, '_final', { default: null });

        if (err) {
            const optional = data['_meta'].settings.optional;
            const values = !optional ? [err, { meta, data, result: err }] : [null, { meta, data, result }];

            return callback(...values);
        }

        return callback(null, { meta, data, result });
    });
};
