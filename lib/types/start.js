'use strict';

// Load modules

const Hoek = require('hoek');
const Any = require('./any');
const Mercy = require('../');


// Declare internals

const internals = {};


module.exports = internals.Start = class extends Any {

    constructor(...args) {

        super();
        this._type = 'start';
        this._settings = Hoek.clone({ args });

        console.log(this);

        // const label = args.slice().pop;
        //
        // const args = Array.from(arguments);
        // const arg0 = (args.length > 1) && args.slice(0, 1).pop();
        // const dependency = arg0 && Hoek.contain(this._tasks, { label: arg0 }, { deep: true, part: true });

        // const settings = {
        //     label: !dependency && label,
        //     depends: dependency ? args.slice(0, -1) : args.slice(1, -1),
        //     options: args.slice(-1).pop()
        // };


        const task = (data, next) => {

            const { server } = data.compose.result;

            server.start((err) => {

                if (err) {
                    return callback(err);
                }

                return callback(null, { result: { server } });
            });
        };

        this.append([
            Mercy.flow(...args, task),
        ]);
    }
};
