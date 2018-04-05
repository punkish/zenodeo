const Joi = require('joi');
const Config = require('../../../config.js');
const ResponseMessages = require('../../response-messages');
const Utils = require('../utils.js');
const Cache = Utils.cache('record');
const Database = require('better-sqlite3');

// better messages
const Boom = require('boom');

const db = new Database('data/tb.sqlite');

const treatment = {

    method: 'GET',

    path: "/treatment/{id}",

    config: {
        description: "treatment",
        tags: ['treatment', 'api'],
        plugins: {
            'hapi-swagger': {
                order: 2,
                responseMessages: ResponseMessages
            }
        },
        validate: {
            params: {
                id: Joi.string().required()
            }
        },
        notes: [
            'This is the main route for fetching a treatment matching an id.'
        ]
    },
    
    handler: function(request, reply) {
        const uri = Config.uri + 'treatment/' + encodeURIComponent(request.params.id);

        const cacheKey = Utils.createCacheKey(uri);

        Cache.get(cacheKey, function(err, result) {
            if (err) {
                console.log(err);
            }

            if (result) {
                reply(result);
            }
            else {
                const result = db.prepare('SELECT * FROM treatments WHERE treatment_id = ?').get(request.params.id);

                if (result) {
                    Cache.put(cacheKey, result, function(err) {
                        if (err) {
                            console.log(err);
                        }
    
                        reply(result);
                    });
                }
                else {
                    //reply('not found').code(204);
                    reply(Boom.notFound('Cannot find the requested treatment'))
                }
            }
        });
    }
};

module.exports = treatment;