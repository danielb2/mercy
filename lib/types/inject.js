'use strict';

// Load modules

const Hoek = require('hoek');
const Joi = require('joi');
const Uri = require('urijs');

const Flow = require('./flow');


// Declare internals

const internals = {};


module.exports = internals.Inject = class extends Flow {

    constructor (options) {

        super();

        this._type = 'inject';
        this._style = 'series';
        this._options = (typeof options === 'string') ? { url: options } : options;

        this._final = (value, next) => { return next(null, value); };

        this._children.push({
            label: 'inject',
            depends: [],
            task: (...args) => {

                const next = args.pop();
                const schema = Joi.object().default();

                const input = Joi.validate(args.pop(), schema);
                Hoek.assert(!input.error, input.error && input.error.annotate());

                const server = input.value;
                const options = this._options;

                server.inject(options, (res) => {

                    return next(null, res);
                });
            }
        });

        return this;
    }

    clone () {

        const flow = super.clone();

        flow._options = this._options;

        return this;
    }
};


// internals.cookies = function (data, extract) {
//
//     const jar = {};
//
//     // Set-Cookie applied in order of lookup options
//     for (let i = 0; i < extract.cookies.length; ++i) {
//         const setCookies = data[extract.cookies[i]].res.headers['set-cookie'];
//
//         for (let i = 0; i < setCookies.length; ++i) {
//             const setCookie = setCookies[i].split(';')[0];
//             const [key, value] = setCookie.split('=');
//             jar[key] = value;
//         };
//     }
//
//     const cookies = [];
//     for (let key in jar) {
//         if (jar.hasOwnProperty(key)) {
//             cookies.push(`${key}=${jar[key]}`);
//         }
//     }
//
//     return { cookie: cookies.join(';') };
// };
