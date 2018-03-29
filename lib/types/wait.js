'use strict';

// Load modules

const Async = require('async');
const Hoek = require('hoek');
const Joi = require('joi');

const Flow = require('./flow');
const Input = require('./input');


// Declare internals

const internals = {};


module.exports = internals.Wait = class extends Flow {

    constructor (duration) {

        super();

        this._type = 'wait';
        this._style = 'auto';
        this._settings.wait = duration || 0;

        this._children.push({
            label: 'wait',
            depends: ['_wait'],
            task: (value, next) => { return next(null, value); }
        });

        this.final((data, next) => { return next(null, data['wait']); });

        return this;
    }
};
