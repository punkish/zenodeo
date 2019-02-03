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
const HapiSwagger = require('hapi-swagger');
const swaggerOptions = {
    documentationPage: false,
    documentationPath: "/docs",
    info: Config.info,
    sortEndpoints: 'ordered',
    jsonEditor: false,
    validatorUrl: null,
    schemes: ['http', 'https']
};

/*
 * Hapi process monitoring
 */
// const Good = require('good');
// const goodOptions = {
//     ops: {
//         interval: 1000
//     },
//     reporters: {
//         console: [
//             {
//                 module: 'good-squeeze',
//                 name: 'Squeeze',
//                 args: [{ log: '*', response: 'api' }]
//             }, 
//             { 
//                 module: 'good-console',
//                 args: [{ format: 'MMM Do YYYY, h:mm:ss A' }]
//             },
//             'stdout'
//         ]
//     }
// };

const Debug = require('debug')('server: index')

// API versions
const APIs = [
    { plugin: require('./api/v1/index.js'), routes: { prefix: '/v1' } },
    { plugin: require('./api/v2/index.js'), routes: { prefix: '/v2/' } }
];

let plugins = [
    { plugin: Inert, options: {} },
    { plugin: Vision, options: {} },
    { plugin: Blipp, options: {} } ,
    //{ plugin: Good, options: goodOptions }, 
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
        //require('./resources/deefault'),
    ]);
    

    await server.start();
    Debug(`Server running at: ${server.info.uri}`);
};

process.on('unhandledRejection', (err) => {

    Debug(err);
    process.exit(1);
});

init();