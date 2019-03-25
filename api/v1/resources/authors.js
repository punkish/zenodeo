// api v1
const Utils = require('../utils');
const Schema = require('../schema.js');
const ResponseMessages = require('../../responseMessages')

module.exports = {
    plugin: {
        name: 'authors',
        register: async function(server, options) {

            server.route([
                { 
                    path: '/authors/{term?}', 
                    method: 'GET', 
                     config: {
                        description: 'retrieve all authors starting with the provided letters',
                        tags: ['authors', 'api'],
                        plugins: {
                            'hapi-swagger': {
                                order: 6,
                                responseMessages: ResponseMessages
                            }
                        },
                        validate: Schema.authors,
                        notes: [
                            'This route fetches authors starting with the provided letters.'
                        ]
                    },
                    handler: async function(request, h) {
                        
                        if (request.params.term) {
                            return Utils.find(request.params.term, 'authors');
                        } 
                    
                    }
                }
            ]);
        },
    },
};