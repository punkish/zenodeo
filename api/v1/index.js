const Routes = [
    require('./resources/biosyslit.js'),
    require('./resources/record.js'),
    require('./resources/records.js'),
    require('./resources/files.js'),
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