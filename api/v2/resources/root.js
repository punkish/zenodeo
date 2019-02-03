const ResponseMessages = require('../../response-messages');
const Config = require('../../../config.js');
const Utils = require('../utils.js');

const root = {

    method: 'GET',
    path: '/',
    handler: function(request, h) {

        const r = request.server.plugins.blipp.info()[0].routes;
        const p = [];
        for (let i = 0, j = r.length; i < j; i++) {
            if ((r[i].path.substr(0, 3) === '/v2') && (r[i].path.length > 4)) {
                r[i].path = Config.zenodeo + r[i].path;
                p.push(r[i]);
            }
        }
        
        return Utils.packageResult(Config.zenodeo + '/v2/', p);
    },

    config: {
        description: "root",
        tags: ['api'],
        plugins: {
            'hapi-swagger': {
                order: 1,
                responseMessages: ResponseMessages
            }
        },
        validate: {},
        notes: [
            'Zenodeo API root.',
        ]
    }
};

module.exports = root;