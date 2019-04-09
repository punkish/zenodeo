exports.plugin = {
    name: 'api1',
    version: '1.0.1',
    register: async function(server, options) {

        await server.register([
            { plugin: require('./resources/biosyslit') },
            { plugin: require('./resources/record') },
            { plugin: require('./resources/records') },
            { plugin: require('./resources/files') },
            { plugin: require('./resources/authors') },
            { plugin: require('./resources/keywords') },
            { plugin: require('./resources/families') },
            { plugin: require('./resources/taxa') },
            //require('./resources/treatment.js')
        ])
    }
};