'use strict';


// Start this program from the command line with `pm2`

//     ~/Nodes/punkish$ NODE_ENV=production pm2 start index.js --name zenodeo
//     ~/Nodes/punkish$ pm2 restart zenodeo

const Hapi = require('@hapi/hapi');
const Inert = require('@hapi/inert');
const Vision = require('@hapi/vision');
const HapiSwagger = require('hapi-swagger');

const Disk = require('catbox-disk');
const Blipp = require('blipp');

const config = require('config');
const cacheName = config.get('v2.cache.name');
const cachePath = config.get('v2.cache.path');
const zendeoUri = config.get('v2.uri.zenodeo');
const info = config.get('info');
const swaggeredScheme = config.get('swaggered-scheme');
const port = config.get('port');

//const logger = require(config.get('logger'));
const plog = require(config.get('plog'));

// Generate Swagger-compatible documentation for the app
// The commented options below are listed for completion
// sakes. We don't use them here.
const swaggerOptions = {

    /******** URLs and plugin **************/ 
    schemes: swaggeredScheme,
    //host: 'http://localhost:3030',,
    //auth: false,
    //cors: false

    /******** JSON **************/
    //jsonPath: '/swagger.json',
    //basePath: '/v2/',
    //pathPrefixSize: 2,
    //pathReplacements: [],
    info: info,

    /******** UI **************/
    documentationPage: false,
    documentationPath: "/docs",
    sortEndpoints: 'ordered',
    validatorUrl: null
};

// Create the server. Everything begins here.
const server = new Hapi.server({
    port: port,
    host: 'localhost',
    routes: { cors: true },
    cache: [{
		name: cacheName,
		engine: new Disk({
            cachePath: cachePath,
            cleanEvery: 0,
            partition: 'cache'
        })
    }],
    router: {
        stripTrailingSlash: true
    }
});


const start = async () => {

    await server.register([

        // Inert serves static files
        { plugin: Inert, options: {} },

        // Vision provides templating support (see server.view() below
        { plugin: Vision, options: {} },

        // Blipp just prints out to the console all the routes when
        // the server starts. This is *only* in development mode
        { plugin: Blipp, options: {} },

        // Generate Swagger-compaitible swagger-files and docs auto-
        // magically
        { plugin: HapiSwagger, options: swaggerOptions }
    ]);

    // API v1
    await server.register(
        { plugin: require('./api/v1/index.js'), options: {} },
        { routes: { prefix: '/v1' } }
    );

    // API v2
    await server.register(
        { plugin: require('./api/v2/index.js'), options: {} },
        { routes: { prefix: '/v2' } }
    );

    // Static pages
    server.route([
        require('./resources/inert'),
        require('./resources/docs'),
        require('./resources/tos'),
        require('./resources/install'),
        require('./resources/examples'),
        require('./resources/about'),
        require('./resources/releases'),

        // A catch-all route for any request that hasn't been satisfied
        // by any of the routes so far. Send back a 404 and suggest 
        // a starting point.
        {
            method: '*',
            path: '/{any*}',
            handler: function (request, h) {
    
                return {
                    error: "404 Error! Page Not Found! You might want to start at the root",
                    root: zendeoUri
                }
            }
        }
    ]);

    // Use handlebars for templating
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
    
    await server.start();

    if (process.env.NODE_ENV) {
        console.log(
            'Server running in %s mode on %s', 
            process.env.NODE_ENV.toUpperCase(), 
            server.info.uri
        );
    }
    else {
        console.log(
            'Server running in DEVELOPMENT mode on %s', 
            server.info.uri
        );
    }

    server.events.on('log', (event, tags) => {

        if (tags.error) {
            plog.logger({
                host: server.info.uri,
                start: '',
                end: '',
                status: 500,
                resource: '',
                query: '',
                message: `Server error: ${event.error ? event.error.message : 'unknown'}`
            });
        }
        
    });

    server.events.on('response', function (request) {

        plog.logger({
            host: request.info.host,
            start: request.info.received,
            end: request.info.completed,
            status: request.response.statusCode,
            resource: request.route.path.split('/').pop(),
            query: JSON.stringify(request.query),
            message: request.url.href
        });

    });

};

start();
