const config = require('config');
const cache = config.get('v2.cache');

exports.plugin = {
    name: 'api2',
    version: '1.0.1',
    register: async function(server, options) {

        // let cacheOptions = {
        //     cacheName: cacheName,

        //     // expires in 1440 mins, or one day
        //     expiresIn: 60 * 1000 * 1440,
        //     generateTimeout: false,
        //     getDecoratedValue: true
        // };

        //const cacheOptions = cache;

        await server.register([
            { plugin: require('./resources/root') },
            { plugin: require('./resources/treatments'), options: cache },
            // { plugin: require('./resources/figureCitations'), options: cache },
            // { plugin: require('./resources/treatmentAuthors'), options: cache },
            // { plugin: require('./resources/bibRefCitations'), options: cache },
            // { plugin: require('./resources/materialsCitations'), options: cache },
            // { plugin: require('./resources/images'), options: cache },
            // { plugin: require('./resources/publications'), options: cache },
            { plugin: require('./resources/taxa') },
            { plugin: require('./resources/families') },
            { plugin: require('./resources/keywords') },
            { plugin: require('./resources/authors') },
            // { plugin: require('./resources/wpsummary'), options: cache }
        ]);
    }
};