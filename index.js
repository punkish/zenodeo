'use strict';

const Config = require('./config.js');
const Blipp = require('blipp');
const Hapi = require('hapi');
const Inert = require('inert');
const Vision = require('vision');
const Good = require('good');
const HapiSwagger = require('hapi-swagger');
const Api1 = require('./api/v1/index.js');
//const Api2 = require('./api/v2/index.js');

const goodOptions = {
    ops: {
        interval: 1000
    },
    reporters: {
        console: [
            {
                module: 'good-squeeze',
                name: 'Squeeze',
                args: [
                    {
                        log: '*',
                        response: '*'
                    }
                ]
            },
            {
                module: 'good-console'
            },
            'stdout'
        ]
    }
};

let server = new Hapi.Server();
server.connection({
    host: 'localhost',
    port: Config.port
});

const swaggerOptions = {
    documentationPage: false,
    documentationPath: "/docs",
    info: Config.info,
    sortEndpoints: 'ordered',
    jsonEditor: false,
    validatorUrl: null
};

const plugins = [
    Inert,
    Vision,
    Blipp,
    { register: Good, options: goodOptions },
    { register: HapiSwagger, options: swaggerOptions },
    { register: Api1, routes: { prefix: '/v1' } },
    //{ register: Api2, routes: { prefix: '/v2' } }
];

server.register(
    plugins,
    err => {
        if (err) {
            console.log(err);
        }

        server.views({
            engines: {
                html: require('handlebars')
            },
            relativeTo: __dirname,
            path: './views',
            layoutPath: './views/layouts',
            partialsPath: './views/partials',
            layout: 'main',
            //helpersPath: './templates/helpers'
            isCached: false
        });

        server.route([
            require('./resources/inert'),
            require('./resources/docs'),
            require('./resources/tos'),
            require('./resources/install'),
            require('./resources/about')
        ]);

        server.start(err => {
            if (err) {
                console.log(err);
            }
            else {
                console.log('Server running at:', server.info.uri);
            }
        });
    }
);