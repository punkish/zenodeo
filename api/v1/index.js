exports.register = function(server, options, next) {
    server.route([
        require('./resources/biosyslit.js'),
        require('./resources/record.js'),
        require('./resources/records.js'),
        require('./resources/files.js'),
        require('./resources/authors.js'),
        require('./resources/keywords.js'),
        require('./resources/families.js'),
        require('./resources/taxa.js'),
        require('./resources/treatment.js')
    ]);
    next();
};

exports.register.attributes = {
    name: 'api1',
    version: '1.0.1'
};