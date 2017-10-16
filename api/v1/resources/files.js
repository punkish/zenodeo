const Joi = require('joi');
const Wreck = require('wreck');
const Config = require('../../../config.js');
const ResponseMessages = require('../../response-messages');
const Cache = require('memory-cache');

const files = {

    method: 'GET',

    path: '/files/{file_id}',

    config: {
        description: "files",
        tags: ['file', 'api'],
        plugins: {
            'hapi-swagger': {
                order: 4,
                responseMessages: ResponseMessages
            }
        },
        validate: {
            params: {
                file_id: Joi.string()
            }
        },
        notes: [
            'This is just a note',
        ]
    },
    
    handler: function(request, reply) {
        const uri = Config.uri + 'files/' + encodeURIComponent(request.params.file_id);
        const responseExists = Cache.get(uri);

        if (responseExists) {
            reply(responseExists);
        }
        else {
            Wreck.get(uri, (err, res, payload) => {

                if (err) {
                    reply(err);
                    return;
                }
                
                reply(payload).headers = res.headers;
            });
        }
    }
};

module.exports = files;