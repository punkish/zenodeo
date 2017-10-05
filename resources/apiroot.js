const Wreck = require('wreck');
const config = require('../config.js');

const apiroot = {

    method: 'GET',

    path: '/',

    config: {
        description: "Zenodo root",
        tags: ['zenodo', 'communities', 'api'],
        plugins: {
            'hapi-swagger': {
                order: 1
            }
        },
        validate: {},
        notes: [
            'communities'
        ]
    },

    handler: function(request, reply) {
        Wreck.get(config.uri, (err, res, payload) => {

            reply(payload).headers = res.headers;
        })
    }
};

module.exports = apiroot;