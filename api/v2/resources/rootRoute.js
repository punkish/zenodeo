'use strict';

/*************************************************************
 *
 * This is the root of the API. It lists all the routes to the 
 * resources available to the user
 * 
 *************************************************************/

module.exports = {
    plugin: {
        name: 'root',
        register: function(server, options) {

            
            server.route([
                { 
                    path: '/', 
                    method: 'GET', 
                    handler: function(request, h) {
    
                        const routes = server.table().filter(r => { 
                            
                            return r.path.split('/')[1] === 'v2'

                        }).map(r => {

                            let description = r.settings.description;
                            const path = r.path;
                            let name = path.split('/')[2] || 'root'
                            
                            return {
                                name: name,
                                description: description,
                                path: `${server.info.uri}${path}`
                            }
                        });
                        
                        return routes;
                    
                    },
                    options: {
                        description: 'API root listing all available resources',
                        tags: ['root', 'api'],
                        plugins: {
                            'hapi-swagger': {
                                order: 1,
                                responseMessages: require('../../responseMessages')
                            }
                        },
                        notes: [
                            'This is the root of the API. It lists all available resources.'
                        ]
                    }
                }
            ]);
        },
    },
};
