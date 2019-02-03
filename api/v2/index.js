exports.plugin = {
    name: 'api2',
    version: '2.0.1',
    register: async function(server, options) {

        server.route([
            require('./resources/root.js'),
            require('./resources/communities.js'),
            require('./resources/record.js'),
            require('./resources/records.js'),
            require('./resources/wpsummary.js'),
            require('./resources/treatment.js'),
            require('./resources/treatments.js'),
            require('./resources/authors.js'),
            require('./resources/keywords.js'),
            require('./resources/families.js'),
            require('./resources/taxa.js')
        ])
    }
};