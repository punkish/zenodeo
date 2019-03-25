const Utils = require('../utils');
const Schema = require('../schema.js');
const ResponseMessages = require('../../responseMessages')

module.exports = {
    plugin: {
        name: 'families',
        register: async function(server, options) {

            server.route([
                { 
                    path: '/families/{term?}', 
                    method: 'GET', 
                     config: {
                        description: 'retrieve all families starting with the provided letters',
                        tags: ['families', 'api'],
                        plugins: {
                            'hapi-swagger': {
                                order: 7,
                                responseMessages: ResponseMessages
                            }
                        },
                        validate: Schema.families,
                        notes: [
                            'This route fetches the families starting with the provided letters.'
                        ]
                    },
                    handler: async function(request, h) {
                        
                        if (request.params.term) {
                            return Utils.find(request.params.term, 'families');
                        } 
                    
                    }
                }
            ]);
        },
    },
};