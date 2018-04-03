'use strict';

// Load modules

const Hoek = require('hoek');
const Joi = require('joi');

const Flow = require('./flow');


// Declare internals

const internals = {};


module.exports = internals.Validate = class extends Flow {

    constructor (schema) {

        super();

        this._type = 'validate';
        this._style = 'series';
        this._final = (value, next) => { return next(null, value); };

        this._children.push({
            label: 'validate',
            depends: [],
            task: (...args) => {

                const next = args.pop();
                Joi.validate(args.pop(), schema, (err, result) => {

                    if (err) {
                        return next(err);
                    }

                    return next(null, result);
                });
            }
        });

        return this;
    }
};
