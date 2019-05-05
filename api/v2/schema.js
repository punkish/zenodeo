'use strict';

const fs = require('fs');
const Joi = require('joi');
//const csv = require('csvtojson');
const csvFilePath = './dataDictionary/data-dictionary.csv';

// async function run() {

//     const jsObj = await csv().fromFile(csvFilePath)
//     const schemaObj = {};

//     const j = jsObj.length
//     for (let i = 0; i < j; i++) {
//         const el = jsObj[i]
//         schemaObj[el.table] = {}
//     }

//     const b = {};
//     for (let i = 0; i < j; i++) {
//         const el = jsObj[i]
//         const table = el.table
//         const plaziName = el.plaziName
//         delete(el.table)
//         delete(el.plaziName)

//         schemaObj[table][plaziName] = el;
//     }

//     return schemaObj
// }

const csvjson = require('csvjson');
const data = fs.readFileSync(csvFilePath, { encoding : 'utf8'});

const jsObj = csvjson.toObject(data, {
    delimiter : ',',
    quote     : '"'
});

const schemaObj = {};

const j = jsObj.length
for (let i = 0; i < j; i++) {
    const el = jsObj[i]
    schemaObj[el.table] = {}
}

const b = {};
for (let i = 0; i < j; i++) {
    const el = jsObj[i]
    const table = el.table
    const plaziName = el.plaziName
    delete(el.table)
    delete(el.plaziName)

    schemaObj[table][plaziName] = el;
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

    records: {
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

            communities: Joi.string()
                .description('The community on Zenodo; defaults to "biosyslit"')
                .valid('all', 'biosyslit', 'belgiumherbarium')
                .default('biosyslit')
                .optional(),

            q: Joi.string()
                .description(schemaObj.treatments.treatmentId.description)
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
            
            // treatmentId: Joi.string()
            //     .description("All other query params are ignored if treatmentId is provided.")
            //     .optional(),
            treatmentId: Joi.string()
                .description(schemaObj.treatments.treatmentId.description)
                .optional(),

            format: Joi.string()
                .description('Respose format')
                .when('treatmentId', {
                    is: Joi.string(), 
                    then: Joi.optional()
                }),

            // If 'treatmentId' is present in the queryString, all of 
            // the below are ignored if also present.
            // The following rules apply *only* if 'treatmentId' is 
            // not present
            page: Joi.number()
                .integer()
                .description('Starting page, defaults to 1')
                .default(1)
                .when('treatmentId', {
                    is: Joi.string(), 
                    then: Joi.optional(),
                    otherwise: Joi.required() 
                }),

            size: Joi.number()
                .integer()
                .description('Number of records to fetch per query, defaults to 30')
                .default(30)
                .when('treatmentId', {
                    is: Joi.string(), 
                    then: Joi.optional(),
                    otherwise: Joi.required() 
                }),

            // If 'treatmentId' is present in the 
            // queryString, all of the below are 
            // ignored if also present.
            // The following rules apply *only* if 
            // 'treatmentId' is not present
            treatmentTitle: Joi.string()
                .description(schemaObj.treatments.treatmentTitle.description)
                .optional(),

            journalTitle: Joi.string()
                .description(schemaObj.treatments.journalTitle.description)
                .optional(),

            journalYear: Joi.string()
                .description(schemaObj.treatments.journalYear.description)
                .optional(),

            authorityName: Joi.string()
                .description(schemaObj.treatments.authorityName.description)
                .optional(),

            authorityYear: Joi.string()
                .description(schemaObj.treatments.authorityYear.description)
                .optional(),

            kingdom: Joi.string()
                .description(schemaObj.treatments.kingdom.description)
                .optional(),

            phylum: Joi.string()
                .description(schemaObj.treatments.phylum.description)
                .optional(),

            order: Joi.string()
                .description(schemaObj.treatments.order.description)
                .optional(),

            family: Joi.string()
                .description(schemaObj.treatments.family.description)
                .optional(),

            genus: Joi.string()
                .description(schemaObj.treatments.genus.description)
                .optional(),

            species: Joi.string()
                .description(schemaObj.treatments.species.description)
                .optional(),

            rank: Joi.string()
                .description(schemaObj.treatments.rank.description)
                .optional(),

            q: Joi.string()
                .description(schemaObj.treatments.fullText.description)
                .optional(),

            lat: Joi.number()
                .min(-180)
                .max(180)
                .description('latitude')
                .optional(),

            lon: Joi.number()
                .min(-180)
                .max(180)
                .description('longitude')
                .optional()
        }
    },

    treatmentAuthors: {
        query: {
            treatmentAuthor: Joi.string()
                .description(schemaObj.treatmentAuthors.treatmentAuthor.description)
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
