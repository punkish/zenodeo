const Utils = require('../utils.js');
const ResponseMessages = require('../../response-messages');
const Config = require('../../../config.js');
const Schema = require('../schema.js');

const families = {
    method: 'GET',
    path: 'families/{term?}',
    handler: function (request, h) {
        if (request.params.term) {
            return Utils.packageResult(`${Config.zenodeo}/v2/families/${request.params.term}`, Utils.find(request.params.term, 'families'));
        }
    },
    config: {
        description: 'retrieve all families starting with the provided letters',
        tags: ['families', 'api'],
        plugins: {
            'hapi-swagger': {
                order: 10,
                responseMessages: ResponseMessages
            }
        },
        validate: Schema.families,
        notes: [
            'This route fetches families matching the search term (the portion after /families/ in the URI).'
        ]
    }
};

module.exports = families;