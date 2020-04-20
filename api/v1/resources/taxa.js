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
                        validate: {
                            params: Schema.taxa.params,
                            failAction: (request, h, err) => {
                                throw err;
                                return;
                            }
                        },
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