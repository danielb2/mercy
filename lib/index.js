'use strict';

// Load modules

const Hoek = require('hoek');
const Joi = require('joi');

const Any = require('./types/any');


// Declare internals

const internals = {
    flow: require('./types/flow'),
    input: require('./types/input'),
    wait: require('./types/wait'),
    compose: require('./types/compose'),
    start: require('./types/start'),
    prepare: require('./types/prepare'),
    stop: require('./types/stop'),
    validate: require('./types/validate'),
    transform: require('./types/transform'),
    reach: require('./types/reach'),
    wreck: require('./types/wreck'),
    inject: require('./types/inject'),
};


internals.root = function () {

    const root = new Any();

    root.version = require('../package.json').version;

    root.flow = (...args) => {

        const input = (args.length === 1) ? args.pop() : args;

        Hoek.assert(!input._isMercy, 'Will not create new flow that consists of only a single Mercy.flow()');

        const schema = Joi.array().single().items([
            Joi.func().minArity(1),
            Joi.object().unknown(),
            Joi.array().items(Joi.lazy(() => schema))
        ]);

        const tasks = Joi.validate(input, schema);
        Hoek.assert(!tasks.error, tasks.error && tasks.error.annotate());

        return new internals.flow((tasks.value.length > 1) ? tasks.value : tasks.value.pop());
    };

    root.execute = (...args) => {

        const callback = args.pop();
        const flow = (!args.slice(-1).pop()._isMercy) ? new internals.flow(args.pop()) : args.pop();

        Hoek.assert(typeof callback === 'function', 'Missing callback');
        Hoek.assert(flow._isMercy, 'Must be Mercy object');

        flow._execute(...args, (err, { meta, data, result }) => {

            return callback(err, meta, data, result);
        });
    };

    root.input = (...args) => {

        return new internals.input(...args);
    };

    root.wait = (...args) => {

        return new internals.wait(...args);
    };

    root.compose = (...args) => {

        Hoek.assert(args.length, 'Mercy.compose() missing arguments.');

        return new internals.compose(...args);
    };

    root.start = (...args) => {

        return new internals.start(...args);
    };

    root.stop = (...args) => {

        return new internals.stop(...args);
    };

    root.prepare = (...args) => {

        Hoek.assert(args.length, 'Mercy.prepare() missing arguments.');

        return new internals.prepare(...args);
    };

    root.validate = (...args) => {

        Hoek.assert(args.length, 'Mercy.validate() missing arguments.');

        return new internals.validate(...args);
    };

    root.transform = (...args) => {

        Hoek.assert(args.length, 'Mercy.transform() missing arguments.');

        return new internals.transform(...args);
    };

    root.reach = (...args) => {

        Hoek.assert(args.length, 'Mercy.reach() missing arguments.');

        return new internals.reach(...args);
    };

    root.wreck = (...args) => {

        return new internals.wreck(...args);
    };

    root.inject = (...args) => {

        return new internals.inject(...args);
    };

    return root;
};


module.exports = internals.root();
