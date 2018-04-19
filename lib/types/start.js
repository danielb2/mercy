'use strict';

// Load modules

const Hoek = require('hoek');
const Joi = require('joi');

const Flow = require('./flow');


// Declare internals

const internals = {};


module.exports = internals.Compose = class extends Flow {

    constructor () {

        super();

        this._type = 'start';
        this._style = 'waterfall';

        this._final = (last, next) => { return next(null, last); };

        return this._tasks();
    }

    _tasks () {

        const start = (server, next) => {

            server.start((err) => {

                if (err) {
                    return next(err);
                }

                return next(null, server);
            });
        };

        return super.tasks(start);
    }

    clone () {

        return super.clone();
    }

    tasks () { Hoek.assert(false, 'Modification of Mercy.start() `tasks` is forbidden'); }
    auto () { Hoek.assert(false, 'Modification of Mercy.start() `style` is forbidden'); }
    parallel () { Hoek.assert(false, 'Modification of Mercy.start() `style` is forbidden'); }
    series () { Hoek.assert(false, 'Modification of Mercy.start() `style` is forbidden'); }
    waterfall () { Hoek.assert(false, 'Modification of Mercy.start() `style` is forbidden'); }
};
