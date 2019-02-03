// v2 schema
const Joi = require('joi');

const schema = {

    communities: {
        query: {
            name: Joi.string()
                .description('The Zenodo Community to be queried for the records; defaults to "biosyslit"')
                .valid('all', 'biosyslit', 'icedig')
                .required(),

            refreshCache: Joi.boolean()
                .description("force refresh cache")
                .default(false),
        }
    },

    record: {
        params: {
            id: Joi.number()
                .description("record id")
                .integer()
                .positive()
                .required()
        },
        query: {
            refreshCache: Joi.boolean()
                .description("force refresh cache")
                .default(false),

            images: Joi.boolean()
                .description("retrieve only the images for the record")
                .optional()
                .default(false),

            communities: Joi.string()
                .description('The community on Zenodo; defaults to "biosyslit"')
                .valid('all', 'biosyslit', 'icedig')
                .default('biosyslit')
        }
    },

    records: {
        query: {
            page: Joi.number()
                .integer()
                .description('Starting page, defaults to 1')
                .required()
                .default(1),

            size: Joi.number()
                .integer()
                .description('Number of records to fetch per query, defaults to 30')
                .required()
                .default(30),

            communities: Joi.string()
                .description('The community on Zenodo; defaults to "biosyslit"')
                .valid('all', 'biosyslit', 'icedig')
                .default('biosyslit'),

            q: Joi.string()
                .description('Text string for full-text search'),

            file_type: Joi.string()
                .description('File type, usually determined by the extension')
                .optional()
                .valid(
                    'png', 
                    'jpg', 
                    'pdf', 
                    'xml', 
                    'xlsx', 
                    'docx', 
                    'xls', 
                    'csv', 
                    'svg', 
                    'doc'
                ),

            type: Joi.string()
                .description('Type of resource')
                .optional()
                .valid(
                    'image', 
                    'publication', 
                    'dataset', 
                    'presentation', 
                    'video'
                ),
        
            image_subtype: Joi.string()
                .description('Subtype based on the file_type \"image\"')
                .optional()
                .when(
                    'type', {
                        is: 'image',
                        then: Joi.valid(
                            'figure', 
                            'photo', 
                            'drawing', 
                            'other', 
                            'diagram', 
                            'plot'
                        )
                    }
                ),

            publication_subtype: Joi.string()
                .description('Subtype based on the file_type \"publication\"')
                .optional()
                .when(
                    'type', {
                        is: 'image',
                        then: Joi.valid(
                            'article', 
                            'conferencepaper', 
                            'report', 
                            'other', 
                            'book', 
                            'thesis', 
                            'section', 
                            'workingpaper', 
                            'deliverable', 
                            'preprint'
                        )
                    }
                ),

            access_right: Joi.string()
                .description('Access rights for the resource')
                .optional()
                .valid(
                    'open', 
                    'closed', 
                    'embargoed', 
                    'restricted'
                ),

            keywords: Joi.array()
                .description('More than one keywords may be used')
                .optional(),

            summary: Joi.boolean()
                .description('Summarize the results to record IDs')
                .default(true),

            images: Joi.boolean()
                .description('Return only image links for each record'),

            refreshCache: Joi.boolean()
                .default(false)
        }
    },

    files: {
        params: {
            file_id: Joi.string()
        }
    },

    treatment: {
        params: {
            id: Joi.string().required()
        }
    },

    treatments: {
        query: {
            q: Joi.string().description('freetext search')
        }
    },

    authors: {
        params: {
            term: Joi.string().required()
        }
    },

    keywords: {
        params: {
            term: Joi.string().required()
        }
    },

    families: {
        params: {
            term: Joi.string().required()
        }
    },

    taxa: {
        params: {
            term: Joi.string().required()
        }
    }
};

module.exports = schema;