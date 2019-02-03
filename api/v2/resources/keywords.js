const Utils = require('../utils.js');
const ResponseMessages = require('../../response-messages');
const Config = require('../../../config.js');
const Schema = require('../schema.js');

const keywords = {
    method: 'GET',
    path: 'keywords/{term?}',
    handler: function (request, h) {
        if (request.params.term) {
            return Utils.packageResult(`${Config.zenodeo}/v2/keywords/${request.params.term}`, Utils.find(request.params.term, 'keywords'));
        }
    },
    config: {
        description: 'retrieve all keywords starting with the provided letters',
        tags: ['keywords', 'api'],
        plugins: {
            'hapi-swagger': {
                order: 9,
                responseMessages: ResponseMessages
            }
        },
        validate: Schema.keywords,
        notes: [
            'This route fetches keywords matching the search term (the portion after /keywords/ in the URI).'
        ]
    }
};

module.exports = keywords;