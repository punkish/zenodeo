'use strict';

// any values set here override the same values set 
// in default.js

const host = 'http://z2.punkish.org';

module.exports = {

    loglevel: 'ERROR',

    v1: {
        uri: {
            zenodeo: `${host}/v1`
        }
    },

    v2: {
        // cache: {
        //     on: false
        // },

        uri: {
            zenodeo: `${host}/v2`
        }
    }
}