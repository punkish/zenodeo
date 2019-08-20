/*
Start this program from the command line with `pm2`

    ~/Nodes/punkish$ NODE_ENV=production pm2 start index.js --name zenodeo
    ~/Nodes/punkish$ NODE_ENV=production pm2 restart zenodeo
*/

'use strict';

const Hapi = require('hapi');
const Disk = require('catbox-disk');
const debug = require('debug')('v2: index');
const config = require('config');
const cacheName = config.get('cache.v2.name');
const cachePath = config.get('cache.v2.path');
debug(cachePath)
const info = config.get('info');
const swaggeredScheme = config.get('swaggered-scheme');
const port = config.get('port');
const logger = require(config.get('logger'));

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
const HapiSwagger = require('hapi-swagger');
const swaggerOptions = {
    documentationPage: false,
    documentationPath: "/docs",
    info: info,
    sortEndpoints: 'ordered',
    jsonEditor: false,
    validatorUrl: null,
    schemes: swaggeredScheme
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
        { plugin: HapiSwagger, options: swaggerOptions },
        { plugin: require('./api/v1/index.js'), routes: { prefix: '/v1' } },
        { plugin: require('./api/v2/index.js'), routes: { prefix: '/v2' } }
    ]);
    
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

    logger({
        host: server.info.uri,
        start: '',
        end: '',
        status: 200,
        resource: 'zenodeo',
        query: '',
        message: `Server running at: ${server.info.uri}`
    });

};

start();