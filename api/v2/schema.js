// v2 schema
'use strict';

const Joi = require('@hapi/joi');
const config = require('config');
const dataDict = require(config.get('v2.dataDict'));

// get all the descriptions from the data dictionary
const descriptions = {};
for (let table in dataDict) {
    const cols = dataDict[table];
    for (let i = 0, j = cols.length; i < j; i++) {
        const key = cols[i].plazi;
        const val = cols[i].definition;
        descriptions[key] = val;
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
        .description(`The community on Zenodo; defaults to <b>${defaults.communities[1]}</b>`)
        .valid('all', 'biosyslit', 'belgiumherbarium')
        .default(defaults.communities[1]),
        
    q: Joi.string()
        .description('any text string')
        .optional(),

    qreq: Joi.string()
        .description('any text string')
        .required(),

    treatmentId: Joi.string()
        .alphanum()
        .description(descriptions.treatmentId)
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
        .description(`Usually the author. Use the following syntax:

Starts with « Ago » 
*This will find all Ago; Agosti; Agostini and so on.*

        ┌─────────────┐
        │     Ago     │
        └─────────────┘

Is exactly « Agosti, Donat »
*Keep in mind, this will *not* find « Donat Agosti »*

        ┌─────────────────┐
        │ "Agosti, Donat" │
        └─────────────────┘

Either « Agosti » OR « Donat »
*This will find Agostini, Carlos; Donat; Donat Agosti and so on.*

        ┌──────────────┐
        │ Agosti Donat │
        └──────────────┘

Both « Agosti » AND « Donat »
*This will find Agosti, Donat; Donat Agosti; and other variations with these two words*

        ┌──────────────────┐
        │ Agosti AND Donat │
        └──────────────────┘`)
        .optional(),

    title: Joi.string()
        .description(`Title of the record. Use the following syntax:

Starts with « pea » 
*This will find all pea; peacock; peabody and so on.*

        ┌─────────────┐
        │     pea     │
        └─────────────┘

Is exactly « spider, peacock »
*Keep in mind, this will *not* find « peacock spider »*

        ┌───────────────────┐
        │ "spider, peacock" │
        └───────────────────┘

Either « spider » OR « peacock »
*This will find spider, peacock; Donat; Donat Agosti and so on.*

        ┌────────────────┐
        │ spider peacock │
        └────────────────┘

Both « spider » AND « peacock »
*This will find spider, peacock; peacock spider; and other variations with these two words*

        ┌────────────────────┐
        │ spider AND peacock │
        └────────────────────┘`)
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

            format: Joi.string()
                .description('Response format')
                .when('treatmentId', {
                    is: Joi.string(), 
                    then: Joi.optional()
                }),

            communities: schemaDefaults.communities,
            page: schemaDefaults.page,
            size: schemaDefaults.size,
            refreshCache: schemaDefaults.refreshCache,
            treatmentId: schemaDefaults.treatmentId,
            q: schemaDefaults.q,
            
            publicationDate: Joi.string()
                .alphanum()
                .description(descriptions.publicationDate)
                .optional(),

            journalYear: Joi.string()
                .description(descriptions.journalYear)
                .optional(),

            journalVolume: Joi.number()
                .description(descriptions.journalVolume)
                .optional(),

            journalIssue: Joi.number()
                .description(descriptions.journalIssue)
                .optional(),

            authorityYear: Joi.string()
                .description(descriptions.authorityYear)
                .optional(),

            treatmentTitle: Joi.string()
                .description(descriptions.treatmentTitle)
                .optional(),

            articleTitle: Joi.string()
                .description(descriptions.articleTitle)
                .optional(),

            journalTitle: Joi.string()
                .description(descriptions.journalTitle)
                .optional(),

            authorityName: Joi.string()
                .description(descriptions.authorityName)
                .optional(),
            
            taxonomicNameLabel: Joi.string()
                .description(descriptions.taxonomicNameLabel)
                .optional(),
            
            kingdom: Joi.string()
                .description(descriptions.kingdom)
                .optional(),

            phylum: Joi.string()
                .description(descriptions.phylum)
                .optional(),

            order: Joi.string()
                .description(descriptions.order)
                .optional(),

            family: Joi.string()
                .description(descriptions.family)
                .optional(),

            genus: Joi.string()
                .description(descriptions.genus)
                .optional(),

            rank: Joi.string()
                .description(descriptions.rank)
                .optional(),

            species: Joi.string()
                .description(descriptions.species)
                .optional(),

            status: Joi.string()
                .description(descriptions.status)
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

            page: schemaDefaults.page,
            size: schemaDefaults.size,
            refreshCache: schemaDefaults.refreshCache,

            figureCitationId: Joi.string()
                .description(descriptions.figureCitationId)
                .optional(),

            treatmentId: schemaDefaults.treatmentId,
            q: schemaDefaults.q
        })
    },

    treatmentCitations: {
        query: Joi.object({

            page: schemaDefaults.page,
            size: schemaDefaults.size,
            refreshCache: schemaDefaults.refreshCache,

            treatmentCitationId: Joi.string()
                .description(descriptions.treatmentCitationId)
                .optional(),

            treatmentId: schemaDefaults.treatmentId,
            
            treatmentCitation: Joi.string()
                .description(descriptions.treatmentCitation)
                .optional(),

            refString: Joi.string()
                .description(descriptions.refString)
                .optional(),
        })
    },

    citations: {
        query: Joi.object({

            page: schemaDefaults.page,
            size: schemaDefaults.size,
            refreshCache: schemaDefaults.refreshCache,

            bibRefCitationId: Joi.string()
                .description(descriptions.bibRefCitationId)
                .optional(),

            treatmentId: schemaDefaults.treatmentId,

            year: Joi.string()
                .description(descriptions.year)
                .optional(),

            q: schemaDefaults.q,

            sortBy: Joi.string()
                .description('sort column:sort order')
                .optional()
                .default('year:ASC'),

            facets: Joi.boolean()
                .description('whether or not to fetch facets')
                .optional()
                .default(false),

            stats: Joi.boolean()
                .description('whether or not to fetch stats')
                .optional()
                .default(false)
        })
    },

    treatmentAuthors: {
        query: Joi.object({

            page: schemaDefaults.page,
            size: schemaDefaults.size,
            refreshCache: schemaDefaults.refreshCache,

            treatmentAuthorId: Joi.string()
                .description(descriptions.treatmentAuthorId)
                .optional(),

            treatmentId: schemaDefaults.treatmentId,

            treatmentAuthor: Joi.string()
                .description(descriptions.treatmentAuthor)
                .optional()
        })
    },

    materialsCitations: {
        query: Joi.object({

            page: schemaDefaults.page,
            size: schemaDefaults.size,
            refreshCache: schemaDefaults.refreshCache,

            materialsCitationId: Joi.string()
                .description(descriptions.materialsCitationId)
                .optional(),

            treatmentId: schemaDefaults.treatmentId,

            materialsCitationId: Joi.string()
                .description(descriptions.materialsCitationId)
                .optional(),

            collectingDate: Joi.string()
            .description(descriptions.collectingDate)
            .optional(),
            collectionCode: Joi.string()
            .description(descriptions.collectionCode)
            .optional(), 
            collectorName: Joi.string()
            .description(descriptions.collectorName)
            .optional(),
            country: Joi.string()
            .description(descriptions.country)
            .optional(),
            collectingRegion: Joi.string()
            .description(descriptions.collectingRegion)
            .optional(),
            municipality: Joi.string()
            .description(descriptions.municipality)
            .optional(),
            county: Joi.string()
            .description(descriptions.county)
            .optional(),
            stateProvince: Joi.string()
            .description(descriptions.stateProvince)
            .optional(),
            location: Joi.string()
            .description(descriptions.location)
            .optional(),
            locationDeviation: Joi.string()
            .description(descriptions.locationDeviation)
            .optional(), 
            specimenCountFemale: Joi.string()
            .description(descriptions.specimenCountFemale)
            .optional(), 
            specimenCountMale: Joi.string()
            .description(descriptions.specimenCountMale)
            .optional(), 
            specimenCount: Joi.string()
            .description(descriptions.specimenCount)
            .optional(), 
            specimenCode: Joi.string()
            .description(descriptions.specimenCode)
            .optional(), 
            typeStatus: Joi.string()
            .description(descriptions.typeStatus)
            .optional(), 
            determinerName: Joi.string()
            .description(descriptions.determinerName)
            .optional(),
            collectingDate: Joi.string()
            .description(descriptions.collectingDate)
            .optional(), 
            collectedFrom: Joi.string()
            .description(descriptions.collectedFrom)
            .optional(), 
            collectingMethod: Joi.string()
            .description(descriptions.collectingMethod)
            .optional()
        })
    },

    wpsummary: {
        query: Joi.object({
            q: schemaDefaults.qreq,
        })
    },

    // no caching for any of the resources below
    authors: {
        query: Joi.object({
            q: schemaDefaults.qreq,
        })
    },

    keywords: {
        query: Joi.object({
            q: schemaDefaults.qreq,
        })
    },

    families: {
        query: Joi.object({
            q: schemaDefaults.qreq,
        })
    },

    taxa: {
        query: Joi.object({
            q: schemaDefaults.qreq,
        })
    }
};

module.exports = schema;