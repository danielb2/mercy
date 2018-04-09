'use strict';

// Load modules

const Hoek = require('hoek');
const Joi = require('joi');
const Uri = require('urijs');
const Wreck = require('wreck');

const Flow = require('./flow');


// Declare internals

const internals = {};


module.exports = internals.Wreck = class extends Flow {

    constructor () {

        super();

        this._type = 'wreck';
        this._style = 'series';
        this._wreck = Wreck;
        this._method = null;
        this._defaults = {};

        this._final = (value, next) => { return next(null, value); };

        this._children.push({
            label: 'wreck',
            depends: [],
            task: (...args) => {

                const next = args.pop();
                const schema = Joi.object().keys({ uri: Joi.string().default(''), options: Joi.object().default() });

                const input = Joi.validate(args.pop(), schema);
                Hoek.assert(!input.error, input.error && input.error.annotate());

                const method = this._method.toLowerCase();
                const options = input.value.options;
                const base = new Uri(Hoek.reach(this, '_defaults.baseUrl', { default: '' }));
                const uri = new Uri(input.value.uri);
                const url = (new Uri(base, uri)).toString();

                this._wreck[method](url, options, (err, response, payload) => {

                    if (err) {
                        return next(err, { response, payload });
                    }

                    return next(null, { response, payload });
                });
            }
        });

        return this;
    }

    clone () {

        const flow = super.clone();

        flow._wreck = this._wreck;
        flow._method = this._method;
        flow._defaults = this._defaults;

        return this;
    }

    defaults (...args) {

        return internals.defaults.call(this, null, ...args);
    }

    read (options) {

        const flow = this.clone();
        flow._defaults = Hoek.applyToDefaults(flow._defaults, options);
        flow._wreck = flow._wreck.defaults(flow._defaults);

        return flow;
    }

    get (...args) {

        return internals.defaults.call(this, 'GET', ...args);
    }

    put (...args) {

        return internals.defaults.call(this, 'PUT', ...args);
    }

    post (...args) {

        return internals.defaults.call(this, 'POST', ...args);
    }

    delete (...args) {

        return internals.defaults.call(this, 'DELETE', ...args);
    }

    patch (...args) {

        return internals.defaults.call(this, 'PATCH', ...args);
    }
};


internals.defaults = function (method, ...args) {

    const flow = this.clone();
    const schema = Joi.alternatives().try([Joi.string(), Joi.object()]);

    const input = Joi.validate(args.pop(), schema);
    Hoek.assert(!input.error, input.error && input.error.annotate());

    const value = input.value;
    const uri = (typeof value === 'string') ? { baseUrl: value } : {};
    const options = (typeof value === 'object') ? value : {};

    flow._method = method ? method : flow._method;
    flow._defaults = Hoek.applyToDefaults(flow._defaults, options);
    flow._defaults = Hoek.applyToDefaults(flow._defaults, uri);
    flow._wreck = flow._wreck.defaults(flow._defaults);

    return flow;
};
