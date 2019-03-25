const ResponseMessages = require('../../responseMessages')

module.exports = {
    plugin: {
        name: 'root2',
        register: function(server, options) {

            
            server.route([
                { 
                    path: '/', 
                    method: 'GET', 
                    config: {
                        description: 'API root listing all available resources',
                        tags: ['root', 'api'],
                        plugins: {
                            'hapi-swagger': {
                                order: 1,
                                responseMessages: ResponseMessages
                            }
                        },
                        notes: [
                            'This is the root of the API. It lists all available resources.'
                        ]
                    },
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
                                path: path
                            }
                        });
                        
                        return routes;
                    
                    }
                }
            ]);
        },
    },
};
