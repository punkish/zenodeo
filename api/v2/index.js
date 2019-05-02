const config = require('config');
const cacheName = config.get('cache.v2.name');

exports.plugin = {
    name: 'api2',
    version: '1.0.1',
    register: async function(server, options) {

        let cacheOptions = {
            cacheName: cacheName,

            // expires in 1440 mins, or one day
            expiresIn: 60 * 1000 * 1440,
            generateTimeout: false,
            getDecoratedValue: true
        };

        await server.register([
            { plugin: require('./resources/root') },
            //{ plugin: require('./routes/communities'), options: cacheOptions },
            { plugin: require('./resources/authors') },
            { plugin: require('./resources/keywords') },
            { plugin: require('./resources/families') },
            { plugin: require('./resources/taxa') },
            { plugin: require('./resources/wpsummary'), options: cacheOptions },
            //{ plugin: require('./resources/records'), options: cacheOptions },
            { plugin: require('./resources/images'), options: cacheOptions },
            { plugin: require('./resources/treatments'), options: cacheOptions }
        ]);
    }
};