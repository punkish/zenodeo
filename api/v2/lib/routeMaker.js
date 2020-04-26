'use strict';

/*************************************************************
 *
 * This is a factory routine that takens in a resource 
 * description and returns a handler
 * 
 *************************************************************/

const { Schema } = require('./dd2schema');
const Utils = require('../utils');

const h = function(resource) {
    
    // Since there are two groups of resources on zenodeo, namely the 
    // zenodeoCore (really, the treatments) and the zenodeoRelated (
    // the resources related to each treatment stored in FK-linked 
    // tables in the database), we coalesce them into one (because there) 
    // only one factory routine for generating the handler and the  
    // getRecords functions for them)
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
    
                // lookup resources don't use a cache
                //if (! resource.group !== 'lookups') {
                if (resource.cache) {

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
                                responseMessages: require('../../responseMessages')
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
