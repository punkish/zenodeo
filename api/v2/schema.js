// v2 schema
'use strict';

const Joi = require('joi');
const config = require('config');
const dataDict = require(config.get('v2.dataDict'));

let descriptions = {};


for (let table in dataDict) {
    const cols = dataDict[table];
    for (let i = 0, j = cols.length; i < j; i++) {
        descriptions[cols[i].plazi] = cols[i].definition;
    }
}

module.exports = {

    communities: {
        query: {
            name: Joi.string()
                .description('The Zenodo Community to be queried for the records; defaults to "biosyslit"')
                .valid('all', 'biosyslit', 'belgiumherbarium')
                .default('biosyslit')
                .required(),

            refreshCache: Joi.boolean()
                .description("force refresh cache")
                .default(false),
        }
    },

    images: {
        query: {
            
            id: Joi.number()
                .description("record id. All other query params are ignored if id is provided.")
                .integer()
                .positive()
                .optional(),

            // If 'id' is present in the queryString, all of 
            // the below are ignored if also present.
            // The following rules apply *only* if 'id' is 
            // not present
            page: Joi.number()
                .integer()
                .description('Starting page, defaults to 1')
                .default(1)
                .when('id', {
                    is: Joi.number().integer().positive(), 
                    then: Joi.optional(),
                    otherwise: Joi.required() 
                }),

            size: Joi.number()
                .integer()
                .description('Number of records to fetch per query, defaults to 30')
                .default(30)
                .when('id', {
                    is: Joi.number().integer().positive(), 
                    then: Joi.optional(),
                    otherwise: Joi.required() 
                }),

            // communities: Joi.string()
            //     .description('The community on Zenodo; defaults to "biosyslit"')
            //     .valid('all', 'BLR', 'belgiumherbarium')
            //     .default('BLR')
            //     .optional(),

            q: Joi.string()
                .description('any text string')
                .optional(),

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
                .when('id', {is: Joi.number().integer().positive(), then: Joi.optional() } )
                .optional(),

            // summary: Joi.boolean()
            //     .description('Summarize the results to record IDs')
            //     .default(true),

            // images: Joi.boolean()
            //     .description('Return only image links for each record'),

            refreshCache: Joi.boolean()
                .description("force refresh cache")
                .optional()
                .default(false)
        }
    },

    files: {
        params: {
            file_id: Joi.string()
        }
    },

    treatments: {
        query: {
            
            treatmentId: Joi.string()
                .description(descriptions.treatmentId)
                .optional(),

            format: Joi.string()
                .description('Response format')
                .when('treatmentId', {
                    is: Joi.string(), 
                    then: Joi.optional()
                }),

            page: Joi.number()
                .integer()
                .description('Starting page, defaults to 1')
                .default(1)
                .when('treatmentId', {
                    is: Joi.string(), 
                    then: Joi.optional(),
                    //otherwise: Joi.required() 
                }),

            size: Joi.number()
                .integer()
                .description('Number of records to fetch per query, defaults to 30')
                .default(30)
                .when('treatmentId', {
                    is: Joi.string(), 
                    then: Joi.optional(),
                    //otherwise: Joi.required() 
                }),

            refreshCache: Joi.boolean()
                .description("force refresh cache")
                .optional()
                .default(false),

            // If 'treatmentId' is present in the queryString, all of the below are 
            // ignored if also present. The following rules apply *only* if 
            // 'treatmentId' is not present
            treatmentTitle: Joi.string()
                .description(descriptions.treatmentTitle)
                .optional(),

            journalTitle: Joi.string()
                .description(descriptions.journalTitle)
                .optional(),

            journalYear: Joi.string()
                .description(descriptions.journalYear)
                .optional(),

            authorityName: Joi.string()
                .description(descriptions.authorityName)
                .optional(),

            authorityYear: Joi.string()
                .description(descriptions.authorityYear)
                .optional(),

            kingdom: Joi.string()
                .description(descriptions.kingdom)
                .optional(),

            phylum: Joi.string()
                .description(descriptions.phylum)
                .optional(),

            order: Joi.string()
                .description(descriptions['"order"'])
                .optional(),

            family: Joi.string()
                .description(descriptions.family)
                .optional(),

            genus: Joi.string()
                .description(descriptions.genus)
                .optional(),

            species: Joi.string()
                .description(descriptions.species)
                .optional(),

            rank: Joi.string()
                .description(descriptions.rank)
                .optional(),

            q: Joi.string()
                .description(descriptions.fullText)
                .optional(),

            lat: Joi.number()
                .min(-180)
                .max(180)
                .description(descriptions.latitude)
                .optional(),

            lon: Joi.number()
                .min(-180)
                .max(180)
                .description(descriptions.longitude)
                .optional()
        }
    },

    treatmentAuthors: {
        query: {
            treatmentAuthor: Joi.string()
                .description(descriptions.treatmentAuthor)
                .optional()
        }
    },

    wpsummary: {
        query: {
            q: Joi.string().required()
        }
    },

    // no caching for any of the resources below
    authors: {
        query: {
            q: Joi.string().required()
        }
    },

    keywords: {
        query: {
            q: Joi.string().required()
        }
    },

    families: {
        query: {
            q: Joi.string().required()
        }
    },

    taxa: {
        query: {
            q: Joi.string().required()
        }
    }

}
