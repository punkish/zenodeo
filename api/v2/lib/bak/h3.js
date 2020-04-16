'use strict';

const Schema = require('./dd2schema');
const ResponseMessages = require('../../responseMessages');
const handler = require('../lib/z3');

const h = function(resource) {
    
    return {
        plugin: {
            name: `${resource.name}2`,
            register: function(server, options) {
    
                server.route([{ 
                    path: `/${resource.name.toLowerCase()}`,   
                    method: 'GET', 
                    handler: handler(resource),

                    options: {
                        description: `Fetch ${resource.name} from Zenodeo starting with the provided letters (at least 3 characters required)`,
                        tags: [resource.name, 'api'],
                        plugins: {
                            'hapi-swagger': {
                                order: resource.order,
                                responseMessages: ResponseMessages
                            }
                        },
                        validate: Schema[resource.name],
                        notes: [
                            `This is the main route for fetching ${resource.name} from Zenodeo matching the provided query parameters (q=???).`
                        ]
                    },
    
                    
                }]);
            },
        },
    }

};

module.exports = h;