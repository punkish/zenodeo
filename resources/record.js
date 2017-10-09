const Joi = require('joi');
const Wreck = require('wreck');
const config = require('../config.js');

const record = {

    method: 'GET',

    path: "/record/{id}",

    config: {
        description: "records",
        tags: ['record', 'api'],
        plugins: {
            'hapi-swagger': {
                order: 2
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
            'This is the main route for fetching a record matching an id or a set of records matching the provided query parameters.',
        ]
    },
    
    handler: function(request, reply) {
        const uri = config.uri + 'records/' + encodeURIComponent(request.params.id);

        Wreck.get(uri, (err, res, payload) => {
            
            if (request.query.images) {
                
                let images = [];
                const bucket = JSON.parse(payload.toString())
                    .links
                    .bucket;
    
                Wreck.get(bucket, (err, res, payload) => {
                    JSON.parse(payload.toString()).contents.forEach(function(element) {
                        images.push(element.links.self);
                    });
    
                    reply(images).headers = res.headers;
                });
            }
            else {
                reply(payload).headers = res.headers;
            }
        })
    }
};

module.exports = record;