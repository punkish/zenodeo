// api v2
//const Wreck = require('wreck');
const Utils = require('../utils');
const Schema = require('../schema.js');

module.exports = {
    plugin: {
        name: 'authors2',
        register: async function(server, options) {

            server.route([
                { 
                    path: '/authors', 
                    method: 'GET', 
                    config: {
                        description: 'retrieve all authors starting with the provided letters',
                        tags: ['authors', 'api'],
                        plugins: {
                            'hapi-swagger': {
                                order: 6,
                                //responseMessages: ResponseMessages
                            }
                        },
                        validate: Schema.authors,
                        notes: [
                            'This route fetches authors starting with the provided letters.'
                        ]
                    },
                    handler 
                }
            ]);
        },
    },
};

const handler = async function(request, h) {
    
    if (request.query.q) {
        return Utils.find(request.query.q, 'authors');
    } 

};