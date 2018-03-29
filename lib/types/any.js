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

    clone () {

        const obj = Object.create(Object.getPrototypeOf(this));

        obj._isMercy = true;
        obj._type = this._type;
        obj._bench = this._bench;
        obj._children = this._children;
        obj._final = this._final;
        obj._task = this._task;

        return obj;
    }
};
