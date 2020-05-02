'use strict';

/**************************************************************
 * 
 * The values set here override the same values set 
 * in default.js
 * 
 **************************************************************/

const host = 'https://zenodeo.punkish.org';

module.exports = {

    loglevel: 'ERROR',

    v1: {
        uri: {
            zenodeo: 'https://zenodeo.punkish.org/v1'
        }
    },

    v2: {
        cache: {
            on: true
        },

        uri: {
            zenodeo: 'https://zenodeo.punkish.org/v2'
        }
    },

    'swaggered-scheme': [ 'https' ],
}