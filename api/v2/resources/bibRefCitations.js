'use strict';

// const Schema = require('../schema.js');
// const ResponseMessages = require('../../responseMessages');
// const Utils = require('../utils');

const plugins = {
    _resource: 'citation',
    _resources: 'citations',
    _resourceId: 'bibRefCitationId',
    _name: 'citation2',
    _path: '/citations',
    _order: 3
};

//const {handler, getRecords} = require('../lib/z2');
const h = require('../lib/h2');
module.exports = h(plugins);

// module.exports = {
//     plugin: {
//         name: plugins._name,
//         register: function(server, options) {

//             const cache = Utils.makeCache({
//                 server: server, 
//                 options: options, 
//                 query: getRecords,  
//                 plugins: plugins
//             });

//             // binds the cache to every route registered  
//             // **within this plugin** after this line
//             server.bind({ cache });

//             server.route([{ 
//                 path: plugins._path,   
//                 method: 'GET', 
//                 config: {
//                     description: `Fetch ${plugins._resources} from Zenodeo`,
//                     tags: [plugins._resources, 'api'],
//                     plugins: {
//                         'hapi-swagger': {
//                             order: plugins._order,
//                             responseMessages: ResponseMessages
//                         }
//                     },
//                     validate: Schema[plugins._resources],
//                     notes: [
//                         `This is the main route for fetching ${plugins._resources} from Zenodeo matching the provided query parameters.`
//                     ]
//                 },

//                 handler: handler(plugins) 
//             }]);
//         },
//     },
// };