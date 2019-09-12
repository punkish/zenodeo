/*
Start this program from the command line with `pm2`

    ~/Nodes/punkish$ NODE_ENV=production pm2 start index.js --name zenodeo
    ~/Nodes/punkish$ NODE_ENV=production pm2 restart zenodeo
*/

'use strict';

/*** hapi 18.1.x *************************************/
// const Hapi = require('hapi');
// const Inert = require('inert');
// const Vision = require('vision');
// const HapiSwagger = require('hapi-swagger-9.4.2');

/*** hapi 18.3.1 *************************************/
const Hapi = require('@hapi/hapi');
const Inert = require('@hapi/inert');
const Vision = require('@hapi/vision');
const HapiSwagger = require('hapi-swagger');

const Disk = require('catbox-disk');
const Blipp = require('blipp');

const debug = require('debug')('v2: index');
const config = require('config');
const cacheName = config.get('cache.v2.name');
const cachePath = config.get('cache.v2.path');
const info = config.get('info');
const swaggeredScheme = config.get('swaggered-scheme');
const port = config.get('port');
const logger = require(config.get('logger'));

/*
 * Generate Swagger-compatible documentation for the app
 */

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
    validatorUrl: null,
    uiCompleteScript: 'selectVersion()'
};

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
        { plugin: Inert, options: {} },
        { plugin: Vision, options: {} },
        { plugin: Blipp, options: {} } ,
        { plugin: HapiSwagger, options: swaggerOptions }
    ]);

    await server.register(
        { plugin: require('./api/v1/index.js'), options: {} },
        { routes: { prefix: '/v1' } }
    );

    await server.register(
        { plugin: require('./api/v2/index.js'), options: {} },
        { routes: { prefix: '/v2' } }
    );
    
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
        require('./resources/releases')
    ]);
    
    await server.start();

    server.events.on('log', (event, tags) => {

        if (tags.error) {
            logger({
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

        logger({
            host: request.info.host,
            start: request.info.received,
            end: request.info.completed,
            status: request.response.statusCode,
            resource: request.route.path.split('/').pop(),
            query: JSON.stringify(request.query),
            message: request.url.href
        });

    });

    // logger({
    //     host: server.info.uri,
    //     start: '',
    //     end: '',
    //     status: 200,
    //     resource: 'zenodeo',
    //     query: '',
    //     message: `Server running at: ${server.info.uri}`
    // });

};

start();