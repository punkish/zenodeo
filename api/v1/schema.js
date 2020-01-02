// v1 schema
const Joi = require('@hapi/joi');

const schema = {
    record: {
        params: Joi.object({
            id: Joi.number()
                .description("record id")
                .integer()
                .positive()
                .required()
        }),
        query: Joi.object({
            images: Joi.boolean()
                .description("force refresh cache"),

            refreshCache: Joi.boolean()
                .default(false)
        })
    },

    records: {
        query: Joi.object({
            page: Joi.number()
                .integer()
                .description('starting page')
                .required()
                .default(1),

            size: Joi.number()
                .integer()
                .description('number of records to fetch per query')
                .required()
                .default(30),

            communities: Joi.string()
                .description('the Biodiversity Literatutre Repository community on Zenodo')
                .required()
                .default('biosyslit')
                .valid('biosyslit'),

            q: Joi.string()
                .description('text string for full-text search'),

            file_type: Joi.string()
                .description('file type, usually determined by the extension')
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
                .description('type of resource')
                .optional()
                .valid(
                    'image', 
                    'publication', 
                    'dataset', 
                    'presentation', 
                    'video'
                ),
        
            image_subtype: Joi.string()
                .optional()
                .description('subtype based on the file_type \"image\"')
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
                .description('subtype based on the file_type \"publication\"')
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
                .description('access rights for the resource')
                .optional()
                .valid(
                    'open', 
                    'closed', 
                    'embargoed', 
                    'restricted'
                ),

            keywords: Joi.array()
                .description('more than one keywords may be used')
                .optional(),

            summary: Joi.boolean()
                .description('summarize the results to record IDs')
                .default(true),

            images: Joi.boolean()
                .description('return only image links for each record'),

            refreshCache: Joi.boolean()
                .default(false)
        })
    },

    files: {
        params: Joi.object({
            file_id: Joi.string()
        }),
        query: Joi.object({                
            refreshCache: Joi.boolean()
                .default(false)
        })
    },

    treatments: {
        params: Joi.object({
            id: Joi.string().required()
        }),
        query: Joi.object({
            refreshCache: Joi.boolean()
                .default(false)
        })
    }
};

module.exports = schema;