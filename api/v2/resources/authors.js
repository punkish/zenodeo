const Utils = require('../utils.js');
const ResponseMessages = require('../../response-messages');
const Config = require('../../../config.js');
const Schema = require('../schema.js');

const authors = {
    method: 'GET',
    path: 'authors/{term?}',
    handler: function (request, h) {
        if (request.params.term) {
            return Utils.packageResult(`${Config.zenodeo}/v2/authors/${request.params.term}`, Utils.find(request.params.term, 'authors'));
        }
    },
    config: {
        description: 'retrieve all authors starting with the provided letters',
        tags: ['authors', 'api'],
        plugins: {
            'hapi-swagger': {
                order: 8,
                responseMessages: ResponseMessages
            }
        },
        validate: Schema.authors,
        notes: [
            'This route fetches authors matching the search term (the portion after /authors/ in the URI).'
        ]
    }
};

module.exports = authors;