'use strict';

// any values set here override the same values set 
// in default.js

const host = 'https://zenodeo.punkish.org';

module.exports = {

    loglevel: 'ERROR',

    v1: {
        uri: {
            zenodeo: `${host}/v1`
        }
    },

    v2: {
        cache: {
            on: true
        },

        uri: {
            zenodeo: `${host}/v2`
        }
    }
}