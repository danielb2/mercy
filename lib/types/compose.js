'use strict';

// Load modules

const Hoek = require('hoek');
const Joi = require('joi');
const Glue = require('glue');

const Flow = require('./flow');


// Declare internals

const internals = {
    schema: Joi.object().keys({
        manifest: Joi.object().default(),
        options: Joi.object().default()
    })
};


module.exports = internals.Compose = class extends Flow {

    constructor (manifest, options) {

        super();

        this._type = 'compose';
        this._style = 'series';
        this._final = (value, next) => { return next(null, value); };

        const config = Joi.validate({ manifest, options }, internals.schema);
        Hoek.assert(!config.error, config.error && config.error.annotate());

        const input = [config.value.manifest, config.value.options];

        this._children.push({
            label: 'compose',
            depends: [],
            task: (data, next) => {

                Glue.compose(...input, (err, server) => {

                    if (err) {
                        return callback(err);
                    }

                    return next(null, server);
                });
            }
        });

        return this;
    }
};
