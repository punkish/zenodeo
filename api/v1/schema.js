const Joi = require('joi');

const schema = {
    record: Joi.object().keys({

        communities: Joi.string()
            .description('the Biodiversity Literatutre Repository community on Zenodo')
            .required()
            .default('biosyslit')
            .valid('biosyslit'),

        q: Joi.string()
            .description('text string for full-text search'),

        file_type: Joi.string()
            .description('file type, usually determined by the extension')
            .optional().valid(
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

        /*
        // subtype is dependent on type = image | publication
        subtype: Joi.string().optional()
            // .valid(
            //     'figure', 
            //     'photo', 
            //     'drawing', 
            //     'other', 
            //     'diagram', 
            //     'plot',
            //     'article', 
            //     'conferencepaper', 
            //     'report', 
            //     'other', 
            //     'book', 
            //     'thesis', 
            //     'section', 
            //     'workingpaper', 
            //     'deliverable', 
            //     'preprint'
            // )
            .when('type', {
                is: 'image',
                then: Joi.valid(
                    'figure', 
                    'photo', 
                    'drawing', 
                    'other', 
                    'diagram', 
                    'plot'
                )
            })
            .when('type', {
                is: 'publication', 
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
            })
            .description('subtype based on the file_type'),
            */

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
            .optional()
            .valid(
                'taxonomy', 
                'animalia', 
                'biodiversity', 
                'arthropoda', 
                'insecta', 
                'coleoptera', 
                'arachnida', 
                'hymenoptera', 
                'chordata', 
                'new'
            ),

        summary: Joi.boolean()
            .description('summarize the results to record IDs')
            .default(true),

        images: Joi.boolean()
            .description('return only image links for each record')
    })
};

module.exports = schema;