const Utils = require('../utils.js');
const ResponseMessages = require('../../response-messages');
const Config = require('../../../config.js');
const Schema = require('../schema.js');

const taxa = {
    method: 'GET',
    path: 'taxa/{term?}',
    handler: function (request, h) {
        if (request.params.term) {
            return Utils.packageResult(`${Config.zenodeo}/v2/taxa/${request.params.term}`, Utils.find(request.params.term, 'taxa'));
        }
    },
    config: {
        description: 'retrieve all taxa starting with the provided letters',
        tags: ['taxa', 'api'],
        plugins: {
            'hapi-swagger': {
                order: 11,
                responseMessages: ResponseMessages
            }
        },
        validate: Schema.taxa,
        notes: [
            'This route fetches taxa matching the search term (the portion after /taxa/ in the URI).'
        ]
    }
};

module.exports = taxa;