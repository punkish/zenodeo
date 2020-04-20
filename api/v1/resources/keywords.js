const Utils = require('../utils');
const Schema = require('../schema.js');
const ResponseMessages = require('../../responseMessages')

module.exports = {
    plugin: {
        name: 'keywords',
        register: async function(server, options) {

            server.route([
                { 
                    path: '/keywords/{term?}', 
                    method: 'GET', 
                     config: {
                        description: 'retrieve all keywords starting with the provided letters',
                        tags: ['keywords', 'api'],
                        plugins: {
                            'hapi-swagger': {
                                order: 9,
                                responseMessages: ResponseMessages
                            }
                        },
                        validate: {
                            params: Schema.keywords.params,
                            failAction: (request, h, err) => {
                                throw err;
                                return;
                            }
                        },
                        notes: [
                            'This route fetches the keywords starting with the provided letters.'
                        ]
                    },
                    handler: async function(request, h) {
                        
                        if (request.params.term) {
                            return Utils.find(request.params.term, 'keywords');
                        } 
                    
                    }
                }
            ]);
        },
    },
};