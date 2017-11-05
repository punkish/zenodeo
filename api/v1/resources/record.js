const Joi = require('joi');
const Wreck = require('wreck');
const Config = require('../../../config.js');
const ResponseMessages = require('../../response-messages');
const Utils = require('../utils.js');

const Cache = require('persistent-cache')({
    name: 'record'
});

const record = {

    method: 'GET',

    path: "/record/{id}",

    config: {
        description: "records",
        tags: ['record', 'api'],
        plugins: {
            'hapi-swagger': {
                order: 2,
                responseMessages: ResponseMessages
            }
        },
        validate: {
            params: {
                id: Joi.number().integer().positive().required()
            },
            query: {
                images: Joi.boolean()
            }
        },
        notes: [
            'This is the main route for fetching a record matching an id or a set of records matching the provided query parameters.'
        ]
    },
    
    handler: function(request, reply) {
        const uri = Config.uri + 'records/' + encodeURIComponent(request.params.id);

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
        
                    if (request.query.images) {
                        
                        let images = [];
                        const bucket = JSON.parse(payload.toString())
                            .links
                            .bucket;
            
                        Wreck.get(bucket, (err, res, payload) => {
                            JSON.parse(payload.toString()).contents.forEach(function(element) {
                                images.push(element.links.self);
                            });
            
                            Cache.put(cacheKey, images, function(err) {
                                if (err) {
                                    console.log(err);
                                }

                                reply(images).headers = res.headers;
                            });
                        });
                    }
                    else {
                        const result = JSON.parse(payload.toString());
                        Cache.put(cacheKey, result, function(err) {
                            if (err) {
                                console.log(err);
                            }

                            reply(result).headers = res.headers;
                        });
                    }
                });
            }
        });
    }
};

module.exports = record;