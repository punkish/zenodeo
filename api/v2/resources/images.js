'use strict';

const Schema = require('../schema.js');
const ResponseMessages = require('../../responseMessages');
const Utils = require('../utils');

const plugins = {
    _resource: 'image',
    _resources: 'images',
    _resourceId: 'id',
    _name: 'images2',
    _segment: 'images2',
    _path: '/images',
    _order: 7
};

const {handler, getRecords} = require('../lib/z');

module.exports = {
    plugin: {
        name: plugins._name,
        register: async function(server, options) {

            const cache = Utils.makeCache({
                server: server, 
                options: options, 
                query: getRecords,  
                segment: plugins._segment
            });

            // binds cache to every route registered  
            // **within this plugin** after this line
            server.bind({ cache });

            server.route([{
                path: plugins._path, 
                method: 'GET', 

                config: {
                    description: `Fetch ${plugins._resources} from Zenodo`,
                    tags: [plugins._resources, 'api'],
                    plugins: {
                        'hapi-swagger': {
                            order: plugins._order,
                            responseMessages: ResponseMessages
                        }
                    },
                    validate: Schema[plugins._resources],
                    notes: [
                        `This is the main route for fetching ${plugins._resources} matching the provided query parameters.`
                    ]
                },

                handler: handler(plugins)
            }]);
        },
    },
};