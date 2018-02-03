const Routes = [
    require('./resources/biosyslit.js'),
    require('./resources/record.js'),
    require('./resources/records.js'),
    require('./resources/files.js'),
    require('./resources/authors.js'),
    require('./resources/keywords.js'),
    require('./resources/families.js'),
    require('./resources/taxa.js')
];

exports.register = function (server, options, next) {
    server.route(Routes);
    next();
};

exports.register.attributes = {
    name: 'api1',
    version: '1.0.1'
};

//module.exports = exports.register.attributes.version;