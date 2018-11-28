const Joi = require('joi');
const Wreck = require('wreck');
const Config = require('../../../config.js');
const ResponseMessages = require('../../response-messages');
const Utils = require('../utils.js');
const Cache = Utils.cache('record');

const record = {

    method: 'GET',
    path: "/record",

    config: {
        description: "records",
        tags: ['record', 'api'],
        plugins: {
            'hapi-swagger': {
                order: 2,
                responseMessages: ResponseMessages
            }
        },
        validate: {
            query: {
                id: Joi.number().integer().positive().required(),
                images: Joi.boolean()
            }
        },
        notes: [
            'This is the main route for fetching a record matching an id or a set of records matching the provided query parameters.'
        ]
    },
    
    handler: async function(request, h) {

        try {
            const result = await request.server.methods.apiRecord.v2(uri);
            return h.response({"data": result})
                 .type('application/json')
        }
        catch (err) {
            console.error(err)
        }
    }
};

const apiRecord = async (id) => {
        
    const { res, payload } = await Wreck.get(id);
    return payload.toString();
};

module.exports = {
    record: record,
    apiRecord: apiRecord
};