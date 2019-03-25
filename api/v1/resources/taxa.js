const Utils = require('../utils');
const Schema = require('../schema.js');
const ResponseMessages = require('../../responseMessages')

module.exports = {
    plugin: {
        name: 'taxa',
        register: async function(server, options) {

            server.route([
                { 
                    path: '/taxa/{term?}', 
                    method: 'GET', 
                     config: {
                        description: 'retrieve all taxa starting with the provided letters',
                        tags: ['taxa', 'api'],
                        plugins: {
                            'hapi-swagger': {
                                order: 8,
                                responseMessages: ResponseMessages
                            }
                        },
                        validate: Schema.authors,
                        notes: [
                            'This route fetches taxa starting with the provided letters.'
                        ]
                    },
                    handler: async function(request, h) {
                        
                        if (request.params.term) {
                            return Utils.find(request.params.term, 'taxa');
                        } 
                    
                    }
                }
            ]);
        },
    },
};