'use strict';

const Schema = require('./dd2schema');
const ResponseMessages = require('../../responseMessages');
const Utils = require('../utils');
const {handler, getRecords} = require('../lib/z');

const h = function(plugins) {
    
    return {
        plugin: {
            name: plugins._resource,
            register: async function(server, options) {
    
                // create the cache
                const cache = Utils.makeCache({
                    server: server, 
                    options: options, 
                    query: getRecords,  
                    plugins: plugins
                });
    
                // bind the cache to every route registered  
                // **within this plugin** after this line
                server.bind({ cache });
    
                server.route([{
                    path: `/${plugins._resource.toLowerCase()}`, 
                    method: 'GET',
                    handler: handler(plugins),
    
                    options: {
                        description: `Fetch ${plugins._resource} from Zenodo`,
                        tags: [plugins._resource, 'api'],
                        plugins: {
                            'hapi-swagger': {
                                order: plugins._order,
                                responseMessages: ResponseMessages
                            }
                        },
                        validate: Schema[plugins._resource],
                        notes: [
                            `This is the main route for fetching ${plugins._resource} matching the provided query parameters.`
                        ]
                    },
    
                    
                }]);
            },
        }
    }

};

module.exports = h;