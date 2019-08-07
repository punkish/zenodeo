//const Wreck = require('wreck');
const Utils = require('../utils');
const Schema = require('../schema.js');

module.exports = {
    plugin: {
        name: 'keywords2',
        register: async function(server, options) {

            server.route([
                { 
                    path: '/keywords', 
                    method: 'GET', 
                    config: {
                        description: 'retrieve all keywords starting with the provided letters',
                        tags: ['keywords', 'api'],
                        plugins: {
                            'hapi-swagger': {
                                order: 8,
                                //responseMessages: ResponseMessages
                            }
                        },
                        validate: Schema.keywords,
                        notes: [
                            'retrieve all keywords starting with the provided letters'
                        ]
                    },
                    handler 
                }
            ]);
        },
    },
};

const handler = async function(request, h) {
    
    if (request.query.q) {
        return Utils.find(request.query.q, 'keywords');
    } 

};