'use strict';

// Load modules

const Hoek = require('hoek');
const Joi = require('joi');

const Flow = require('./flow');
const Compose = require('./compose');
const Start = require('./start');


// Declare internals

const internals = {};


module.exports = internals.Prepare = class extends Flow {

    constructor (manifest, options) {

        super();

        this._type = 'prepare';
        this._style = 'series';
        this._final = (value, next) => { return next(null, value); };

        const cfg = Hoek.clone({ manifest, options });

        const compose = new Compose(cfg.manifest, cfg.options);
        const start = new Start();

        this._children.push(
            { label: 'compose', depends: [], task: compose },
            { label: 'start', depends: [], task: start }
        );

        return this;
    }
};
