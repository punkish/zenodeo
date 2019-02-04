/*
Start this program from the command line with `pm2`

    ~/Nodes/punkish$ NODE_ENV=production pm2 start index.js --name zenodeo
    ~/Nodes/punkish$ NODE_ENV=production pm2 restart zenodeo
*/

'use strict';

const Config = require('./config.js');
const Hapi = require('hapi');

/*
 * blipp is a simple hapi plugin to display  
 * the routes table at startup
 */
const Blipp = require('blipp');

/*
 * Static file and directory handlers for hapi.js
 */
const Inert = require('inert');

/*
 * Template rendering support for hapi.js
 */
const Vision = require('vision');

/*
 * Generate Swagger-compatible documentation for the app
 */
console.log(Config.schemes)
const HapiSwagger = require('hapi-swagger');
const swaggerOptions = {
    documentationPage: false,
    documentationPath: "/docs",
    info: Config.info,
    sortEndpoints: 'ordered',
    jsonEditor: false,
    validatorUrl: null
    //schemes: Config.schemes
};

/*
 * Hapi process monitoring
 */
const Good = require('good');
const goodOptions = {
    ops: {
        interval: 1000
    },
    reporters: {
        console: [
            {
                module: 'good-squeeze',
                name: 'Squeeze',
                args: [{
                    log: '*',
                    response: '*'
                }]
            }, {
                module: 'good-console'
            },
            'stdout'
        ]
    }
};

// API versions
const APIs = [
    { plugin: require('./api/v1/index.js'), routes: { prefix: '/v1' } }
    //{ plugin: require('./api/v2/index.js'), routes: { prefix: '/v2' } }
];

let plugins = [
    { plugin: Inert, options: {} },
    { plugin: Vision, options: {} },
    { plugin: Blipp, options: {} } ,
    { plugin: Good, options: goodOptions }, 
    { plugin: HapiSwagger, options: swaggerOptions }
];

// Add the API versions to the list of plugins
APIs.forEach(x => { plugins.push(x) });

const server = Hapi.server({
    port: Config.port,
    host: 'localhost',
    routes: { cors: true }
});

const init = async () => {

    await server.register(plugins);
    
    server.views({
        engines: {
            html: require('handlebars')
        },
        relativeTo: __dirname,
        path: './views',
        layoutPath: './views/layouts',
        partialsPath: './views/partials',
        layout: 'main',
        isCached: false
    });

    server.route([

        require('./resources/inert'),
        require('./resources/docs'),
        require('./resources/tos'),
        require('./resources/install'),
        require('./resources/examples'),
        require('./resources/about'),

        // default route, redirects to the most recent API
        {
            method: 'GET',
            path: '/{param*}',
            config: {
                description: "default route",
                tags: ['private']
            },
            handler: function(request, h) {

                let uri = '';
                if (request.params.param) {

                    uri = `/v${APIs.length}/${request.params.param}`;
                }
                else {
                    uri = `/v${APIs.length}`;
                }

                return h.redirect(uri);
            }
        }
    ]);

    await server.start();
    console.log(`Server running at: ${server.info.uri}`);
};

process.on('unhandledRejection', (err) => {

    console.log(err);
    process.exit(1);
});

init();