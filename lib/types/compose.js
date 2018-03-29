'use strict';

// Load modules

const Hoek = require('hoek');
const Any = require('./any');
const Mercy = require('../');


// Declare internals

const internals = {};


module.exports = internals.Compose = class extends Any {

    constructor(manifest, options) {

        super();
        this._type = 'compose';
        this._settings = Hoek.clone({ manifest, options });

        console.log(this);

        const task = (data, next) => {

            Glue.compose(manifest, options, (err, server) => {

                if (err) {
                    return callback(err);
                }

                return next(null, { result: { server } });
            });
        };

        this.append([
            Mercy.compose('compose', this._settings),
        ]);
    }
};
