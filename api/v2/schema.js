// v2 schema
'use strict';

const Joi = require('@hapi/joi');
const config = require('config');
const dataDict = require(config.get('v2.dataDict'));

let descriptions = {};


for (let table in dataDict) {
    const cols = dataDict[table];
    for (let i = 0, j = cols.length; i < j; i++) {
        descriptions[cols[i].plazi] = cols[i].definition;
    }
}

const defaults = {
    page: 1,
    size: 30,
    communities: ['all', 'biosyslit', 'belgiumherbarium'],
    images: [
        'all',
        'figure', 
        'photo', 
        'drawing', 
        'other', 
        'diagram', 
        'plot'
    ],
    publications: [
        'all',
        'article', 
        'report',  
        'book', 
        'thesis', 
        'section', 
        'workingpaper', 
        'preprint'
    ]
};

const schemaDefaults = {

    id: Joi.number()
        .description("record id. All other query params are ignored if id is provided.")
        .integer()
        .positive()
        .optional(),

    page: Joi.number()
        .integer()
        .description(`Starting page, defaults to <b>${defaults.page}</b>`)
        .default(defaults.page)
        .when('id', {
            is: Joi.number().integer().positive(), 
            then: Joi.optional(),
            otherwise: Joi.required() 
        }),

    size: Joi.number()
        .integer()
        .description(`Number of records to fetch per query, defaults to <b>${defaults.size}</b>`)
        .default(defaults.size)
        .when('id', {
            is: Joi.number().integer().positive(), 
            then: Joi.optional(),
            otherwise: Joi.required() 
        }),

    communities: Joi.string()
        .description(`The community on Zenodo; defaults to <b>${defaults.communities[0]}</b>`)
        .valid('all', 'biosyslit', 'belgiumherbarium')
        .default(defaults.communities[1]),
        
    q: Joi.string()
        .description('any text string')
        .optional(),

    publication_subtypes: Joi.string()
        .description(`Types of publications; defaults to <b>${defaults.publications[0]}</b>`)
        .valid(
            'all',
            'article', 
            'report',  
            'book', 
            'thesis', 
            'section', 
            'workingpaper', 
            'preprint'
        )
        .default(defaults.publications[0]),

    image_subtypes: Joi.string()
        .description(`Types of images; defaults to <b>${defaults.images[0]}</b>`)
        .valid(
            'all',
            'article', 
            'report',  
            'book', 
            'thesis', 
            'section', 
            'workingpaper', 
            'preprint'
        )
        .default(defaults.images[0]),

    // starts with
    // creators.name:/Agosti.--/
    //// creator = /Agosti.--/;

    // single token
    // creators.name:Agosti
    //// creator = 'Agosti';

    // exact phrase
    // creators.name:”Agosti, Donat”
    //// creator = '"Agosti, Donat"';

    // OR
    // creators.name:(Agosti Donat)
    //// creator = 'Agosti Donat';

    // AND
    // creators.name:(Agosti AND Donat) 
    //// creator = 'Agosti AND Donat';
    creator: Joi.string()
        .description(`Usually author. Use the following syntax:
        - starts with « Agosti » → /Agosti.*/, 
        - contains « Agosti » → Agosti,
        - is exactly « Agosti, Donat » → "Agosti, Donat",
        - either « Agosti » or « Donat » → Agosti Donat,
        - both « Agosti » and « Donat » → Agosti AND Donat`)
        .optional(),

    title: Joi.string()
        .description(`Title of the record. Use the following syntax:
        - starts with « peacock » → /peacock.*/, 
        - contains « peacock » → peacock,
        - is exactly « spider, peacock » → "spider, peacock",
        - either « spider » or « peacock » → spider peacock,
        - both « spider » and « peacock" » → spider AND peacock`)
        .optional(),

    keywords: Joi.array()
        .description('More than one keywords may be used')
        .when('id', {
            is: Joi.number().integer().positive(), 
            then: Joi.optional() 
        })
        .optional(),

    facets: Joi.boolean()
        .description('whether or not to fetch facets')
        .optional()
        .default(false),

    stats: Joi.boolean()
        .description('whether or not to fetch stats')
        .optional()
        .default(false),

    refreshCache: Joi.boolean()
        .description("force refresh cache")
        .optional()
        .default(false)
};

const schema = {
    defaults: defaults,

    communities: {
        query: Joi.object({
            name: schemaDefaults.communities,
            refreshCache: schemaDefaults.refreshCache
        })
    },
 
    publications: {
        query: Joi.object({
            id: schemaDefaults.id,

            // If 'id' is present in the queryString, all of 
            // the below are ignored if also present.
            // The following rules apply *only* if 'id' is 
            // not present
            communities: schemaDefaults.communities,
            page: schemaDefaults.page,
            size: schemaDefaults.size,
            q: schemaDefaults.q,
            refreshCache: schemaDefaults.refreshCache,

            // this is actually subtype in Zenodo
            type: schemaDefaults.publication_subtypes,
            creator: schemaDefaults.creator,
            title: schemaDefaults.title,
            keywords: schemaDefaults.keywords,
            facets: schemaDefaults.facets,
            stats: schemaDefaults.stats
        })
    },

    images: {
        query: Joi.object({
            id: schemaDefaults.id,

            // If 'id' is present in the queryString, all of 
            // the below are ignored if also present.
            // The following rules apply *only* if 'id' is 
            // not present
            communities: schemaDefaults.communities,
            page: schemaDefaults.page,
            size: schemaDefaults.size,
            q: schemaDefaults.q,
            refreshCache: schemaDefaults.refreshCache,

            // this is actually subtype in Zenodo
            type: schemaDefaults.image_subtypes,
            creator: schemaDefaults.creator,
            title: schemaDefaults.title,
            keywords: schemaDefaults.keywords,
            facets: schemaDefaults.facets,
            stats: schemaDefaults.stats,
        })
    },

    files: {
        params: Joi.object({
            file_id: Joi.string()
        })
    },

    treatments: {
        query: Joi.object({
            
            treatmentId: Joi.string()
                .alphanum()
                .description(descriptions.treatmentId)
                .optional(),

            format: Joi.string()
                .description('Response format')
                .when('treatmentId', {
                    is: Joi.string(), 
                    then: Joi.optional()
                }),

            communities: schemaDefaults.communities,
            communities: schemaDefaults.communities,
            page: schemaDefaults.page,
            size: schemaDefaults.size,
            q: schemaDefaults.q,
            refreshCache: schemaDefaults.refreshCache,

            treatmentTitle: Joi.string()
                .description(descriptions.treatmentTitle)
                .optional(),

            journalTitle: Joi.string()
                .description(descriptions.journalTitle)
                .optional(),

            journalYear: Joi.string()
                .description(descriptions.journalYear)
                .optional(),

            journalVolume: Joi.number()
                .description(descriptions.journalVolume)
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

            lat: Joi.number()
                .min(-180)
                .max(180)
                .description(descriptions.latitude)
                .optional(),

            lon: Joi.number()
                .min(-180)
                .max(180)
                .description(descriptions.longitude)
                .optional(),

            sortBy: Joi.string()
                .description('sort column:sort order')
                .optional()
                .default('treatmentId:ASC'),

            facets: schemaDefaults.facets,
            stats: schemaDefaults.stats,

            xml: Joi.boolean()
                .description('whether or not to fetch the XML')
                .optional()
                .default(false)
        })
    },

    figureCitations: {
        query: Joi.object({
            figureCitationId: Joi.string()
                .description(descriptions.figureCitationId)
                .optional(),

            page: schemaDefaults.page,
            size: schemaDefaults.size,
            q: schemaDefaults.q,
            refreshCache: schemaDefaults.refreshCache
        })
    },

    citations: {
        query: Joi.object({
            bibRefCitationId: Joi.string()
                .description(descriptions.bibRefCitationId)
                .optional(),

            page: schemaDefaults.page,
            size: schemaDefaults.size,
            q: schemaDefaults.q,
            refreshCache: schemaDefaults.refreshCache,

            // sortBy: Joi.string()
            //     .description('sort column:sort order')
            //     .optional()
            //     .default('bibRefCitationId:ASC'),

            // facets: Joi.boolean()
            //     .description('whether or not to fetch facets')
            //     .optional()
            //     .default(false),

            // stats: Joi.boolean()
            //     .description('whether or not to fetch stats')
            //     .optional()
            //     .default(false)
        })
    },

    treatmentAuthors: {
        query: Joi.object({
            treatmentAuthorId: Joi.string()
                .description(descriptions.treatmentAuthorId)
                .optional(),

            page: schemaDefaults.page,
            size: schemaDefaults.size,
            q: schemaDefaults.q,
            refreshCache: schemaDefaults.refreshCache
        })
    },

    wpsummary: {
        query: Joi.object({
            q: Joi.string().required()
        })
    },

    // no caching for any of the resources below
    authors: {
        query: Joi.object({
            q: Joi.string().required()
        })
    },

    keywords: {
        query: Joi.object({
            q: Joi.string().required()
        })
    },

    families: {
        query: Joi.object({
            q: Joi.string().required()
        })
    },

    taxa: {
        query: Joi.object({
            q: Joi.string().required()
        })
    }
};

module.exports = schema;