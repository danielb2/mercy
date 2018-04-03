'use strict';

// Load modules

const Hoek = require('hoek');
const Joi = require('joi');

const Flow = require('./flow');
const Validate = require('./validate');


// Declare internals

const internals = {};


module.exports = internals.Input = class extends Flow {

    constructor (schema) {

        super();

        this._type = 'input';
        this._style = 'series';
        this._final = (value, next) => { return next(null, value); };;

        this._children.push({
            label: 'input',
            depends: [],
            task: (...args) => {

                const next = args.pop();
                const value = Hoek.reach(args, '0._input', { default: args });

                if (value.length === 0) {
                    return next(null, undefined);
                }

                if (value.length === 1) {
                    return next(null, value.slice().pop());
                }

                return next(null, value);
            }
        });

        if (schema) {
            this._children.push({ label: 'validate', depends: [], task: new Validate(schema) });
        }

        return this;
    }
};
