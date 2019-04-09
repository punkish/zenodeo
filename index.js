/*
Start this program from the command line with `pm2`

    ~/Nodes/punkish$ NODE_ENV=production pm2 start index.js --name zenodeo
    ~/Nodes/punkish$ NODE_ENV=production pm2 restart zenodeo
*/

'use strict';

//const Config = require('./config.js');
const Hapi = require('hapi');
const Disk = require('catbox-disk');

const config = require('config');
const cacheName = config.get('cache.v2.name');
const cachePath = config.get('cache.path');
const info = config.get('info');
const swaggeredScheme = config.get('swaggered-scheme');
const port = config.get('port')

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
    info: info,
    sortEndpoints: 'ordered',
    jsonEditor: false,
<<<<<<< HEAD
    validatorUrl: null
    //schemes: Config.schemes
=======
    validatorUrl: null,
    schemes: swaggeredScheme
>>>>>>> blr
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
                args: [{ log: '*', response: 'api' }]
            }, 
            { 
                module: 'good-console',
                args: [{ format: 'MMM Do YYYY, h:mm:ss A' }]
            },
            'stdout'
        ]
    }
};

const Debug = require('debug')('server: index')

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
        { plugin: Good, options: goodOptions }, 
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
        require('./resources/about')
    ]);
    

    await server.start();
    Debug(`Server running at: ${server.info.uri}`);
};

start();