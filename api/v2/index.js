'use strict';

/*************************************************************************************
 *
 * This is the index of all the routes in this version of the 
 * API. Here is the overall scheme of how this works (see the 
 * specific notes below for more details)
 * 
 *     ┌─────────────┐                                                                
 *     │  index.js   │                                                                
 *     │ (this file) │                                                                
 *     └──────┬──────┘  
 *            │
 *            │                                              
 *    ┌───────▼───────┐                                                               
 *    │┌─────────────┐│        ┌──────────────────────────┐                           
 *    ││ root route  ◀┼────────│ ./resources/rootRoute.js │                           
 *    │└─────────────┘│        └──────────────────────────┘                           
 *    │               │                                                               
 *    │               │                                                               
 *    │┌─────────────┐│       ┌────────────────────────────┐                          
 *    ││other routes ◀┼───────│ ./resources/otherRoutes.js │                          
 *    │└─────────────┘│       └──────────────▲─────────────┘                          
 *    └───────┬───────┘                      │                                        
 *            │                              │                                        
 *            │                              │                                        
 *            │                              │                                        
 *            │                              │                                        
 *  ┌─────────▼─────────┐        ┌───────────────────────┐        ╔════════════╗      
 *  │   register with   │        │ ../lib/routeMaker.js  │◀───────║   Schema   ║      
 *  │       server      │        └───────────────────────┘        ╚════════════╝      
 *  └───────────────────┘                                                ▲            
 *                                                                       │            
 *                                                                       │            
 *                    ┌─────────────────────────────┐        ┌───────────────────────┐
 *                    │ ../lib/dd2datadictionary.js │───────▶│  ../lib/dd2schema.js  │
 *                    └────────────────▲────────────┘        └───────────────────────┘
 *                                     │                                              
 *                                     │                                              
 *                                     │                                              
 *                                     │                                              
 *                    ┌────────────────────────────────┐                              
 *                    │ ../../../dataDictionary/dd.js  │                              
 *                    └────────────────────────────────┘                              
 * 
 ***********************************************************************************/


const config = require('config');
const cache = config.get('v2.cache');

exports.plugin = {
    name: 'api2',
    version: '2.6.0',
    register: async function(server, options) {

        // This is straightforward, just include the root route of the API
        const rootRoute = [{ plugin: require('./resources/rootRoute') }];

        // `otherRoutes` is a factory routine that sends back 
        // fully-formed array of routes
        const otherRoutes = require('./resources/otherRoutes');

        // If the route requires a cache, we add the cache option to it
        otherRoutes.forEach(r => r.options = cache);

        // We also add the `wpsummary` route to this array of routes
        // because this wasn't included in the array of routes returned
        // by `otherRoutes`
        otherRoutes.push({ 
            plugin: require('./resources/wpsummary'), 
            options: cache 
        });
        
        // Concatenate the root route and the other routes and register 
        // all of them with the server.
        const routes = [].concat(rootRoute, otherRoutes);
        await server.register(routes);
    }
};
