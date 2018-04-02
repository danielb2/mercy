'use strict';

// Load modules

const Hoek = require('hoek');
const Joi = require('joi');

const Flow = require('./flow');


// Declare internals

const internals = {};


module.exports = internals.Start = class extends Flow {

    constructor () {

        super();

        this._type = 'start';
        this._style = 'series';
        this._final = (value, next) => { return next(null, value); };

        this._children.push({
            label: 'start',
            depends: [],
            task: (server, next) => {

                server.start((err) => {

                    if (err) {
                        return next(err);
                    }

                    return next(null, server);
                });
            }
        });

        return this;
    }
};