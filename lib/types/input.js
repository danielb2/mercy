'use strict';

// Load modules

const Async = require('async');
const Hoek = require('hoek');
const Joi = require('joi');

const Flow = require('./flow');


// Declare internals

const internals = {};


module.exports = internals.Input = class extends Flow {

    constructor () {

        super();

        this._type = 'input';
        this._style = 'auto';
        this._final = (data, next) => { return next(null, data['input']); };

        this._children.push({
            label: 'input',
            depends: ['_input'],
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

        return this;
    }
};
