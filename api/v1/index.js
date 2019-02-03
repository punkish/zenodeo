exports.plugin = {
    name: 'api1',
    version: '1.0.1',
    register: async function(server, options) {

        server.route([
            require('./resources/biosyslit.js'),
            require('./resources/record.js'),
            require('./resources/records.js'),
            require('./resources/files.js'),
            require('./resources/authors.js'),
            require('./resources/keywords.js'),
            require('./resources/families.js'),
            require('./resources/taxa.js'),
            //require('./resources/treatment.js')
        ])
    }
};