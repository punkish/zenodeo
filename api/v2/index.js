exports.plugin = {
    name: 'api2',
    version: '2.0.1',
    register: async function(server, options) {

        server.route([
            require('./resources/biosyslit.js')['biosyslit'],
            require('./resources/record.js')['record']
        ])
    }
};