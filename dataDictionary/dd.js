'use strict';

/***********************************************************************
 * 
 * Every data-dictionary (dd) element for a resource should 
 * have the following keys
 * 
 * Note: several keys are optional. They can be omitted, or declared 
 * for completeness-sakes but set to ''
 * 
 * plaziName     : The name of the field in the Plazi world
 * 
 * zenodoName    : What Zenodo calls the field. This may not be present
 *                 for certain fields that are unique to the SQL db, 
 *                 for example, the 'treatmentId' (or any SQL table's 
 *                 PRIMARY KEY, for that matter)
 * 
 * sqlType       : The datatype in the SQLite table. This may not be
 *                 present for fields that are present in the query-
 *                 string but not in the database, for example, 'q', 
 *                 'format', 'refreshCache', etc.
 * 
 * cheerioElement: cheeriojs syntax for extracting the field from XML, 
 *                 obviously not needed for fields that don't exist in 
 *                 the treatment XML.
 * 
 * description   : A description of the field in readable English. This 
 *                 description is used in the automatically generated 
 *                 Joi schema that is used to validate the REST API 
 *                 querystring, and is also used in the automatically 
 *                 generated Swagger documentation on the api/docs web 
 *                 page
 * 
 * queryable     : The SQL operator to use if the field can be queried.
 *                 This can be one of the following three –
 *                 - equal
 *                 - like
 *                 - match
 * 
 *                 Note: if the SQL operator is 'match', then a full-
 *                 text search is desired. In that case, an additional
 *                 key called `fts` is required like so
 * 
 *                 fts: {
 *                      column: [name of the FTS virtual table],
 *                      table: [the corresponding JOIN]
 *                 }
 * 
 * queryString   : The parameter key in the URL queryString. Usually 
 *                 this is the same as 'plaziName' but it can be 
 *                 different as in the case of plaziName 'fulltext' 
 *                 which is queried with the queryString param 'q'
 * 
 * validation    : The `Joi` validation string
 * 
 * resourceId    : A boolean indicating whether or not the field is a 
 *                 resourceId of the respective resource
 * 
 * fts           : The MATCH parameters to be used in case of a full-
 *                 text search. See note above
 * 
 **********************************************************************/

const commonParams = {

    all: [
        {
            plaziName     : 'refreshCache',
            zenodoName    : '',
            sqlType       : '',
            cheerioElement: '',
            description   : 'Force refresh cache',
            queryable     : '',
            queryString   : 'refreshCache',
            validation    : 'Joi.boolean().default(false).description(`${d}`).optional()',
            resourceId    : false
        },
        {
            plaziName     : 'page',
            zenodoName    : '',
            sqlType       : '',
            cheerioElement: '',
            description   : 'Starting page, defaults to <b>1</b>',
            queryable     : '',
            queryString   : 'page',
            validation    : 'Joi.number().integer().default(1).description(`${d}`)',
            resourceId    : false
        },
        {
            plaziName     : 'size',
            zenodoName    : '',
            sqlType       : '',
            cheerioElement: '',
            description   : 'Number of records to fetch per query, defaults to <b>30</b>',
            queryable     : '',
            queryString   : 'size',
            validation    : 'Joi.number().integer().min(1).max(100).default(30).description(`${d}`)',
            resourceId    : false
        },
        {
            plaziName     : 'facets',
            zenodoName    : '',
            sqlType       : '',
            cheerioElement: '',
            description   : 'Whether or not to fetch facets',
            queryable     : '',
            queryString   : 'facets',
            validation    : 'Joi.boolean().default(false).description(`${d}`)',
            resourceId    : false
        },
        {
            plaziName     : 'stats',
            zenodoName    : '',
            sqlType       : '',
            cheerioElement: '',
            description   : 'Whether or not to fetch stats',
            queryable     : '',
            queryString   : 'stats',
            validation    : 'Joi.boolean().default(false).description(`${d}`)',
            resourceId    : false
        }
    ],

    zenodeoCore: [],

    zenodeoRelated: [

        // The following is used in every SQL table
        // It is automatically generated and incremented
        // by SQLite
        {
            plaziName     : 'id',
            zenodoName    : '',
            sqlType       : 'INTEGER PRIMARY KEY',
            cheerioElement: '',
            description   : 'The primary key (PK) for this table',
            queryable     : '',
            queryString   : '',
            validation    : '',
            resourceId    : false
        },
    
        // The following definition of 'treatmentId' not 
        // used in the 'treatments' table which has its 
        // own declration (mainly, its `sqlType` and 
        // `resourceId` values are diferent). The following 
        // definition is used in all other tables as a 
        // foreign key (FK)
        {
            plaziName     : 'treatmentId',
            zenodoName    : '',
            sqlType       : 'TEXT NOT NULL',
            cheerioElement: '$("document").attr("docId")',
            description   : 'The unique ID of the parent treatment (FK)',
            queryable     : 'equal',
            queryString   : 'treatmentId',
            validation    : 'Joi.string().guid().description(`${d}`).optional()',
            resourceId    : false
        },
        {
            plaziName     : 'deleted',
            zenodoName    : '',
            sqlType       : 'INTEGER DEFAULT 0',
            cheerioElement: '$("document").attr("deleted")',
            description   : 'A boolean that tracks whether or not this resource is considered deleted/revoked, 1 if yes, 0 if no',
            queryable     : '',
            queryString   : '',
            validation    : '',
            resourceId    : false
        }
    ],

    zenodo: [
        {
            plaziName     : 'id',
            zenodoName    : '',
            sqlType       : '',
            cheerioElement: '',
            description   : 'unique identifier of the record',
            queryable     : 'equal',
            queryString   : 'id',
            validation    : 'Joi.number().integer().description(`${d}`).optional()',
            resourceId    : true
        },
        {
            plaziName     : 'q',
            zenodoName    : '',
            sqlType       : '',
            cheerioElement: '',
            description   : 'term for full-text search',
            queryable     : 'equal',
            queryString   : 'q',
            validation    : 'Joi.string().description(`${d}`).optional()',
            resourceId    : false
        },
        {
            plaziName     : 'creator',
            zenodoName    : 'creator',
            sqlType       : '',
            cheerioElement: '',
            description   : `Usually the author. Use the following syntax:
    
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
            └──────────────────┘`,
            queryable     : 'like',
            queryString   : 'creator',
            validation    : 'Joi.string().description(`${d}`).optional()',
            resourceId    : false
        },
        {
            plaziName     : 'title',
            zenodoName    : 'title',
            sqlType       : '',
            cheerioElement: '',
            description   : `Title of the record. Use the following syntax:
    
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
            └────────────────────┘`,
            queryable     : 'like',
            queryString   : 'title',
            validation    : 'Joi.string().description(`${d}`).optional()',
            resourceId    : false
        },
        {
            plaziName     : 'communities',
            zenodoName    : '',
            sqlType       : '',
            cheerioElement: '',
            description   : 'The community on Zenodo; defaults to <b>"biosyslit"</b>',
            queryable     : '',
            queryString   : 'communities',
            validation    : 'Joi.string().valid("all", "biosyslit", "belgiumherbarium").default("biosyslit").description(`${d}`).optional()',
            resourceId    : false
        },
        {
            plaziName     : 'keywords',
            zenodoName    : 'keywords',
            sqlType       : '',
            cheerioElement: '',
            description   : 'The keywords associated with the publication; more than one keywords may be used',
            queryable     : 'equal',
            queryString   : 'type',
            validation    : 'Joi.string().description(`${d}`).optional()',
            resourceId    : false
        }
    ],

    lookups: []

};

const dd = {
    
    zenodeoCore: {

        treatments: require('./treatments'),

    },

    zenodeoRelated: {

        figureCitations: require('./figureCitations'),
        bibRefCitations: require('./bibRefCitations'),
        treatmentCitations: require('./treatmentCitations'),
        materialsCitations: require('./materialsCitations'),
        treatmentAuthors: require('./treatmentAuthors')

    },

    zenodo: {

        images: require('./images'),
        publications: require('./publications')

    },

    lookups: {

        authors: [
            {
                plaziName     : 'author',
                zenodoName    : '',
                sqlType       : '',
                cheerioElement: '',
                description   : 'retrieve all authors starting with the provided letters',
                queryable     : 'like',
                queryString   : 'q',
                validation    : 'Joi.string().description(`${d}`).required().min(3).message(`a querystring «q» of at least {#limit} characters is required (for example, «?q=ago»)`)',
                resourceId    : false
            }
        ],
    
        keywords: [
            {
                plaziName     : 'keyword',
                zenodoName    : '',
                sqlType       : '',
                cheerioElement: '',
                description   : 'retrieve all keywords starting with the provided letters',
                queryable     : 'like',
                queryString   : 'q',
                validation    : 'Joi.string().description(`${d}`).required().min(3).message(`a querystring «q» of at least {#limit} characters is required (for example, «?q=son»)`)',
                resourceId    : false
            }
        ],
    
        families: [
            {
                plaziName     : 'family',
                zenodoName    : '',
                sqlType       : '',
                cheerioElement: '',
                description   : 'retrieve all families starting with the provided letters',
                queryable     : 'like',
                queryString   : 'q',
                validation    : 'Joi.string().description(`${d}`).required().min(3).message(`a querystring «q» of at least {#limit} characters is required (for example, «?q=ago»)`)',
                resourceId    : false
            }
        ],
    
        taxa: [
            {
                plaziName     : 'taxon',
                zenodoName    : '',
                sqlType       : '',
                cheerioElement: '',
                description   : 'retrieve all taxa starting with the provided letters',
                queryable     : 'like',
                queryString   : 'q',
                validation    : 'Joi.string().description(`${d}`).required().min(3).message(`a querystring «q» of at least {#limit} characters is required (for example, «?q=ago»)`)',
                resourceId    : false
            }
        ]

    }

};

module.exports = { dd: dd, commonParams: commonParams };