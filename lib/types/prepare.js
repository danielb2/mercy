'use strict';

// Load modules

const Hoek = require('hoek');
const Joi = require('joi');

const Flow = require('./flow');
const Compose = require('./compose');
const Start = require('./start');


// Declare internals

const internals = {
    schema: Joi.object().keys({
        manifest: Joi.object().default(),
        options: Joi.object().default()
    })
};


module.exports = internals.Prepare = class extends Flow {

    constructor (manifest, options) {

        super();

        this._type = 'prepare';
        this._style = 'series';
        this._final = (value, next) => { return next(null, value); };

        const config = Joi.validate({ manifest, options }, internals.schema);
        Hoek.assert(!config.error, config.error && config.error.annotate());

        const input = [config.value.manifest, config.value.options];

        const compose = new Compose(...input);
        const start = new Start();

        this._children.push(
            { label: 'compose', depends: [], task: compose },
            { label: 'start', depends: [], task: start }
        );

        return this;
    }
};
