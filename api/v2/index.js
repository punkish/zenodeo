const Routes = [
    require('./resources/biosyslit.js'),
];

exports.register = function (server, options, next) {
    server.route(Routes);
    next();
};

exports.register.attributes = {
    name: 'api2',
    version: '2.0.0'
};