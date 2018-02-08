const Joi = require('joi');
const Wreck = require('wreck');
const Config = require('../../../config.js');
const ResponseMessages = require('../../response-messages');
const Utils = require('../utils.js');
const Cache = Utils.cache('files');

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

        const cacheKey = Utils.createCacheKey(uri);

        Cache.get(cacheKey, function(err, result) {
            if (err) {
                console.log(err);
            }

            if (result) {
                reply(result);
            }
            else {
                Wreck.get(uri, (err, res, payload) => {
    
                    if (err) {
                        reply(err);
                        return;
                    }
                    
                    const result = JSON.parse(payload.toString());
                    Cache.put(cacheKey, result, function(err) {
                        if (err) {
                            console.log(err);
                        }

                        reply(result).headers = res.headers;
                    });
                });
            }
        });
    }
};

module.exports = files;