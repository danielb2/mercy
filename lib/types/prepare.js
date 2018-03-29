'use strict';

// Load modules

const Hoek = require('hoek');
// const Flow = require('./flow');
// const Mercy = require('../');


// Declare internals

const internals = {};


// module.exports = internals.Prepare = class extends Flow {
//
//     constructor(manifest, options) {
//
//         super();
//         this._type = 'server';
//         this._settings = Hoek.clone({ manifest, options });
//
//         console.log(this);
//
//         this.append([
//             Mercy.compose('compose', this._settings),
//             Mercy.start('start', 'compose')
//         ]);
//     }
// };
//
//
// internals.compose = function (settings) {
//
//     return (data, callback) => {
//
//         const { manifest, options } = settings;
//
//         Glue.compose(manifest, options, (err, server) => {
//
//             if (err) {
//                 return callback(err);
//             }
//
//             return callback(null, { result: { server } });
//         });
//     }
// };
//
//
// internals.start = function () {
//
//     return (data, callback) => {
//
//         const { server } = data.compose.result;
//
//         server.start((err) => {
//
//             if (err) {
//                 return callback(err);
//             }
//
//             return callback(null, { result: { server } });
//         });
//     }
// };
