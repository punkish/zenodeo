'use strict';

/**************************************************************
 * 
 * The values set here override the same values set 
 * in default.js
 * 
 **************************************************************/

module.exports = {

    loglevel: 'ERROR',
    root: 'https://zenodeo.org',

    v1: {
        uri: {
            zenodeo: 'https://zenodeo.org/v1'
        }
    },

    v2: {
        cache: {
            on: true
        },

        uri: {
            zenodeo: 'https://zenodeo.org/v2'
        }
    },

    'swaggered-scheme': [ 'https' ],
}