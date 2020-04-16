'use strict';

const Schema = require('./dd2schema');
const ResponseMessages = require('../../responseMessages');
const Utils = require('../utils');

const h = function(resource) {
    
    const { handler, getRecords } = require(`../lib/${resource.group}`);
    const pluginName = resource.group === 'lookups' ? `${resource.name}2` 
                     : resource.name;

    return {
        plugin: {
            name: pluginName,
            register: async function(server, options) {
    
                if (! resource.group !== 'lookups') {

                    // create the cache and 
                    // bind it to every route registered  
                    // **within this plugin** after this line
                    server.bind({ 
                        cache: Utils.makeCache({
                            server: server, 
                            options: options, 
                            query: getRecords,  
                            plugins: resource
                        })
                    });
                }
                
    
                server.route([{
                    path: `/${resource.name.toLowerCase()}`, 
                    method: 'GET',
                    handler: handler(resource),
    
                    options: {
                        description: `Fetch ${resource.name} from ${resource.group}`,
                        tags: [resource.name, 'api'],
                        plugins: {
                            'hapi-swagger': {
                                order: resource.order,
                                responseMessages: ResponseMessages
                            }
                        },
                        validate: Schema[resource.name],
                        notes: [
                            `This is the main route for fetching ${resource.name} matching the provided query parameters.`
                        ]
                    }
    
                    
                }]);
            },
        }
    }

};

module.exports = h;