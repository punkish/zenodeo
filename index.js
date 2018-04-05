'use strict';

const Config = require('./config.js');

// blipp is a simple hapi plugin to display  
// the routes table at startup
const Blipp = require('blipp');
const Hapi = require('hapi');

// Static file and directory handlers for hapi.js
const Inert = require('inert');

// Templates rendering support for hapi.js
const Vision = require('vision');

// hapi process monitoring
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

let server = new Hapi.Server({
    connections: {
        routes: {
          cors: true
        }
    }
});

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
    validatorUrl: null,
    schemes: ['https']
};

const Apis = [
    { register: Api1, routes: { prefix: '/v1' } }
    //{ register: Api2, routes: { prefix: '/v2' } }
];

const plugins = [
    Inert,
    Vision,
    Blipp,
    { register: Good, options: goodOptions },
    { register: HapiSwagger, options: swaggerOptions }
];
Apis.forEach(function(api) {
    plugins.push(api);
});

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

            // redirect to the most recent API
            {
                method: 'GET',
                path: '/',
                config: {
                    description: "default route",
                    tags: ['private']
                },
                handler: function(request, reply) {
                    reply.redirect(Apis[Apis.length - 1].routes.prefix);
                }
            },
            require('./resources/inert'),
            require('./resources/docs'),
            require('./resources/tos'),
            require('./resources/install'),
            require('./resources/examples'),
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