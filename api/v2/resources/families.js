const Wreck = require('wreck');
const Utils = require('../utils');
const Schema = require('../schema.js');

module.exports = {
    plugin: {
        name: 'families2',
        register: async function(server, options) {

            server.route([
                { 
                    path: '/families', 
                    method: 'GET', 
                    config: {
                        description: 'retrieve all families starting with the provided letters',
                        tags: ['families', 'api'],
                        plugins: {
                            'hapi-swagger': {
                                order: 7,
                                //responseMessages: ResponseMessages
                            }
                        },
                        validate: Schema.families,
                        notes: [
                            'This route fetches families starting with the provided letters.'
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
        return Utils.find(request.query.q, 'families');
    } 

};