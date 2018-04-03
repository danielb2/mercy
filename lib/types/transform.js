'use strict';

// Load modules

const Hoek = require('hoek');
const Joi = require('joi');

const Flow = require('./flow');


// Declare internals

const internals = {};


module.exports = internals.Transform = class extends Flow {

    constructor (...options) {

        super();

        this._type = 'transform';
        this._style = 'series';
        this._final = (value, next) => { return next(null, value); };

        this._children.push({
            label: 'transform',
            depends: [],
            task: (...args) => {

                const next = args.pop();
                const result = Hoek.transform(args.pop(), ...options);

                return next(null, result);
            }
        });

        return this;
    }
};
