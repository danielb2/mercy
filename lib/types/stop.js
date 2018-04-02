'use strict';

// Load modules

const Hoek = require('hoek');
const Joi = require('joi');

const Flow = require('./flow');


// Declare internals

const internals = {};


module.exports = internals.Stop = class extends Flow {

    constructor () {

        super();

        this._type = 'stop';
        this._style = 'series';
        this._final = (value, next) => { return next(null, value); };

        this._children.push({
            label: 'stop',
            depends: [],
            task: (server, next) => {

                server.stop((err) => {

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
