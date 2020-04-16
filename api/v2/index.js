'use strict';

const config = require('config');
const cache = config.get('v2.cache');

exports.plugin = {
    name: 'api2',
    version: '1.0.1',
    register: async function(server, options) {

        const rootRoute = [{ plugin: require('./resources/rootRoute') }];

        const otherRoutes = require('./resources/otherRoutes');
        otherRoutes.forEach(r => r.options = cache);
        otherRoutes.push({ 
            plugin: require('./resources/wpsummary'), 
            options: cache 
        });
        
        const routes = [].concat(rootRoute, otherRoutes);
        await server.register(routes);
    }
};