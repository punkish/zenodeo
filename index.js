'use strict';

const config = require('./config.js');
const Blipp = require('blipp');
const Hapi = require('hapi');
const Inert = require('inert');
const Vision = require('vision');
const HapiSwagger = require('hapi-swagger');
const Pack = require('./package.json');
const Routes = [
    require('./resources/index.js'),
    require('./resources/tos.js'),
    require('./resources/biosyslit.js'),
    require('./resources/record.js'),
    require('./resources/records.js'),
    require('./resources/files.js')
];

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
    port: config.port
});

let swaggerOptions = {
    documentationPage: false,
    // documentationPath: "/docs",
    // swaggerUIPath: '/ui/',
    //basePath: '/api/',
    //pathPrefixSize: 2,
    info: {
        title: 'Zenodo API Documentation for BLR',
        version: Pack.version,
        description: "nodejs interface to Zenodo/BLR Community",
        termsOfService: "/tos",
        contact: {
            name: "Puneet Kishor",
            url: "http://punkish.org/About",
            email: "punkish@plazi.org"
        },
        license: {
            name: "CC0 Public Domain Dedication",
            url: "https://creativecommons.org/publicdomain/zero/1.0/legalcode"
        }
    },
    //grouping: 'tags',
    sortEndpoints: 'ordered',
    // tags: [
    //     {
    //         name: 'sum',
    //         description: 'working with maths',
    //         externalDocs: {
    //             description: 'Find out more',
    //             url: 'http://example.org'
    //         }
    //     },
    //     {
    //         name: 'store',
    //         description: 'storing data',
    //         externalDocs: {
    //             description: 'Find out more',
    //             url: 'http://example.org'
    //         }
    //     }
    // ],
    jsonEditor: false,
    validatorUrl: null
};

server.register(
    [
        Inert,
        Vision,
        Blipp,
        {
            register: require('good'),
            options: goodOptions
        },
        {
            register: HapiSwagger,
            options: swaggerOptions
        }

        // {
        //     register: require('lout'),
        //     options: {}
        // }
    ],
    err => {
        if (err) {
            console.log(err);
        }

        server.route(Routes);

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

server.views({
    path: 'public/html',
    engines: {
        html: require('handlebars')
    },
    isCached: false
});