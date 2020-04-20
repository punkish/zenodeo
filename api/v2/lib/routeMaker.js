'use strict';

const { Schema, SchemaLog } = require('./dd2schema');
const ResponseMessages = require('../../responseMessages');
const Utils = require('../utils');

const h = function(resource) {
    
    const rg = resource.group.startsWith('zenodeo') ? 'zenodeo' : resource.group;
    const { handler, getRecords } = require(`../lib/${rg}`);

    // Add a '2' to the name for lookups because lookups by the 
    // same names already exist in api/v1, and plugin names 
    // have to be unique
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
                        validate: {
                            query: Schema[resource.name].query,
                            failAction: (request, h, err) => {
                                throw err;
                                return;
                            }
                        },
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
