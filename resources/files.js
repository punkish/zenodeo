const Joi = require('joi');
const Wreck = require('wreck');
const config = require('../config.js');

const files = {

    method: 'GET',

    path: '/files/{file_id}',

    config: {
        description: "files",
        tags: ['file', 'api'],
        plugins: {
            'hapi-swagger': {
                order: 4
            }
        },
        validate: {
            params: {
                file_id: Joi.string()
            }
        },
        notes: [
            'This is just a note',
        ]
    },
    
    handler: function(request, reply) {
        Wreck.get(config.uri + 'files/' + encodeURIComponent(request.params.file_id), (err, res, payload) => {
            
            reply(payload).headers = res.headers;
        })
    }
};

module.exports = files;