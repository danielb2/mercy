'use strict';

// Load modules

const Async = require('async');
const Hoek = require('hoek');
const Joi = require('joi');


// Declare internals

const internals = {};


module.exports = internals.Any = class {

    constructor () {

        this._isMercy = true;
        this._type = 'any';

        return this;
    }
};
