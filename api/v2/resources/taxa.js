//const Wreck = require('wreck');
const Utils = require('../utils');
const Schema = require('../schema.js');

module.exports = {
    plugin: {
        name: 'taxa2',
        register: async function(server, options) {

            server.route([
                { 
                    path: '/taxa', 
                    method: 'GET', 
                    config: {
                        description: 'retrieve all taxa starting with the provided letters',
                        tags: ['taxa', 'api'],
                        plugins: {
                            'hapi-swagger': {
                                order: 9,
                                //responseMessages: ResponseMessages
                            }
                        },
                        validate: Schema.taxa,
                        notes: [
                            'This route fetches taxa starting with the provided letters.'
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
        return Utils.find(request.query.q, 'taxa');
    } 

};