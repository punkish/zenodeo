const Joi = require('joi');
const Wreck = require('wreck');
const config = require('../config.js');

const records = {
    method: 'GET',

    path: "/records",

    config: {
        description: "records",
        tags: ['record', 'api'],
        plugins: {
            'hapi-swagger': {
                order: 3
            }
        },
        validate: {
            query: {
                communities: Joi.string().valid('biosyslit').required(),
                file_type: Joi
                    .string()
                    .valid('png', 'jpg', 'pdf', 'xml', 'xlsx', 'docx', 'xls', 'csv', 'svg', 'doc')
                    .optional(),
                type: Joi
                    .string()
                    .valid('image', 'publication', 'dataset', 'presentation', 'video')
                    .optional(),
                subtype: Joi
                    .string()
                    .when('type', {is: 'image',       then: Joi.valid('figure', 'photo', 'drawing', 'other', 'diagram', 'plot')})
                    .when('type', {is: 'publication', then: Joi.valid('article', 'conferencepaper', 'report', 'other', 'book', 'thesis', 'section', 'workingpaper', 'deliverable', 'preprint')})
                    .optional()
                    .description('subtype based on the file_type'),
                access_right: Joi
                    .string()
                    .valid('open', 'closed', 'embargoed', 'restricted')
                    .optional(),
                keywords: Joi
                    .string()
                    .valid('taxonomy', 'animalia', 'biodiversity', 'arthropoda', 'insecta', 'coleoptera', 'arachnida', 'hymenoptera', 'chordata', 'new')
                    .optional()
            }
        },
        notes: [
            'This is the main route for fetching a record matching an id or a set of records matching the provided query parameters.',
        ]
    },
    
    handler: function(request, reply) {
        let uri = config.uri + 'records/';
        
        if (Object.keys(request.query).length > 1) {
            uri += '?communities=biosyslit';

            if (request.query.file_type) {
                uri += '&file_type=' + encodeURIComponent(request.query.file_type);
            }
            
            if (request.query.subtype) {
                uri += '&subtype=' + encodeURIComponent(request.query.subtype);
            }
            
            if (request.query.access_right) {
                uri += '&access_right=' + encodeURIComponent(request.query.access_right);
            }
        }

        Wreck.get(uri, (err, res, payload) => {
            const records = JSON.parse(payload.toString())
                .hits
                .hits
                .map(function(el) {
                    return el.links.self;
                });

            reply(records).headers = res.headers;
            //reply(payload).headers = res.hits.hits;            
        })
    }
};

module.exports = records;