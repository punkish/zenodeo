'use strict';

/***********************************************************************
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

 const commonQueryParams = [
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
 ];

 const commonZenodeoQueryParams = [

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
    // `resourceId` values are diferet). The following 
    // definition is used in all other tables as a 
    // foreign key (FK)
    {
        plaziName     : 'treatmentId',
        zenodoName    : '',
        sqlType       : 'TEXT NOT NULL',
        cheerioElement: '$("document").attr("docId")',
        description   : 'The unique ID of the treatment',
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
];

 const commonZenodoQueryParams = [
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
 ];

const dd = {
    treatments: [
        {
            plaziName     : 'id',
            zenodoName    : '',
            sqlType       : 'INTEGER PRIMARY KEY',
            cheerioElement: '',
            description   : 'pk',
            queryable     : '',
            queryString   : '',
            validation    : '',
            resourceId    : false
        },
        {
            plaziName     : 'treatmentId',
            zenodoName    : '',
            sqlType       : 'TEXT NOT NULL UNIQUE',
            cheerioElement: '$("document").attr("docId")',
            description   : 'The unique ID of the treatment',
            queryable     : 'equal',
            queryString   : 'treatmentId',
            validation    : 'Joi.string().guid().description(`${d}`).optional()',
            resourceId    : true
        },
        {
            plaziName     : 'treatmentTitle',
            zenodoName    : 'title',
            sqlType       : 'TEXT',
            cheerioElement: '$("document").attr("docTitle")',
            description   : 'Title of the article that contains this treatment',
            queryable     : 'like',
            queryString   : 'treatmentTitle',
            validation    : 'Joi.string().description(`${d}`).optional()',
            resourceId    : false
        },
        {
            plaziName     : 'doi',
            zenodoName    : 'relatedidentifiers[isPartOf]',
            sqlType       : 'TEXT',
            cheerioElement: '$("document").attr("ID-DOI")',
            description   : 'DOI of journal article',
            queryable     : 'equal',
            queryString   : 'doi',
            validation    : 'Joi.string().description(`${d}`).optional()',
            resourceId    : false
        },
        {
            plaziName     : 'zenodoDep',
            zenodoName    : 'relatedidentifiers[isPartOf]',
            sqlType       : 'TEXT',
            cheerioElement: '$("document").attr("ID-Zenodo-Dep")',
            description   : 'Zenodo record of journal article',
            queryable     : '',
            queryString   : '',
            validation    : '',
            resourceId    : false
        },
        {
            plaziName     : 'zoobank',
            zenodoName    : 'relatedidentifiers[isPartOf]',
            sqlType       : 'TEXT',
            cheerioElement: '$("document").attr("ID-ZooBank")',
            description   : 'ZooBank ID of journal article',
            queryable     : '',
            queryString   : '',
            validation    : '',
            resourceId    : false
        },
        {
            plaziName     : 'articleTitle',
            zenodoName    : '',
            sqlType       : 'TEXT',
            cheerioElement: '$("document").attr("masterDocTitle")',
            description   : 'The title of the article in which the treatment was found',
            queryable     : 'like',
            queryString   : 'articleTitle',
            validation    : 'Joi.string().description(`${d}`).optional()',
            resourceId    : false
        },
        {
            plaziName     : 'publicationDate',
            zenodoName    : 'publicationDate',
            sqlType       : 'TEXT',
            cheerioElement: '$("mods\\\\:detail[type=pubDate] mods\\\\:number").text()',
            description   : 'The date of the publication of the article. If a complete date is not available (for example, if only the year is available), then the last day of the year is used.',
            queryable     : 'equal',
            queryString   : 'publicationDate',
            validation    : 'Joi.string().description(`${d}`).optional()',
            resourceId    : false
        },
        {
            plaziName     : 'journalTitle',
            zenodoName    : 'journal_title',
            sqlType       : 'TEXT',
            cheerioElement: '$("mods\\\\:relatedItem[type=host] mods\\\\:titleInfo mods\\\\:title").text()',
            description   : 'The title of the journal',
            queryable     : 'like',
            queryString   : 'journalTitle',
            validation    : 'Joi.string().description(`${d}`).optional()',
            resourceId    : false
        },
        {
            plaziName     : 'journalYear',
            zenodoName    : 'journal_year',
            sqlType       : 'TEXT',
            cheerioElement: '$("mods\\\\:relatedItem[type=host] mods\\\\:part mods\\\\:date").text()',
            description   : 'The year of the journal',
            queryable     : 'equal',
            queryString   : 'journalYear',
            validation    : 'Joi.string().description(`${d}`).optional()',
            resourceId    : false
        },
        {
            plaziName     : 'journalVolume',
            zenodoName    : 'journal_volume',
            sqlType       : 'TEXT',
            cheerioElement: '$("mods\\\\:relatedItem[type=host] mods\\\\:part mods\\\\:detail[type=volume] mods\\\\:number").text()',
            description   : 'The volume of the journal',
            queryable     : 'equal',
            queryString   : 'journalVolume',
            validation    : 'Joi.string().description(`${d}`).optional()',
            resourceId    : false
        },
        {
            plaziName     : 'journalIssue',
            zenodoName    : 'journal_issue',
            sqlType       : 'TEXT',
            cheerioElement: '$("mods\\\\:relatedItem[type=host] mods\\\\:part mods\\\\:detail[type=issue] mods\\\\:number").text()',
            description   : 'The issue of the journal',
            queryable     : '',
            queryString   : '',
            validation    : 'Joi.string().description(`${d}`).optional()',
            resourceId    : false
        },
        {
            plaziName     : 'pages',
            zenodoName    : 'pages',
            sqlType       : 'TEXT',
            cheerioElement: '$("mods\\\\:relatedItem[type=host] mods\\\\:part mods\\\\:extent[unit=page] mods\\\\:start").text() + "–" + $("mods\\\\:relatedItem[type=host] mods\\\\:part mods\\\\:extent[unit=page] mods\\\\:end").text()',
            description   : 'The "from" and "to" pages where the treatment occurs in the article',
            queryable     : '',
            queryString   : '',
            validation    : 'Joi.string().description(`${d}`).optional()',
            resourceId    : false
        },
        {
            plaziName     : 'authorityName',

            // this should be subject: scientificName authority: dwc http://rs.tdwg.org/dwc/terms/scientificNameAuthorship
            zenodoName    : 'creators',
            sqlType       : 'TEXT',
            cheerioElement: '$("subSubSection[type=nomenclature] taxonomicName").attr("authorityName")',
            description   : 'The name of the author(s) of the taxon (not necessarily the same as the authors of the journal article, but ommited if same as article authors)',
            queryable     : 'like',
            queryString   : 'authorityName',
            validation    : 'Joi.string().description(`${d}`).optional()',
            resourceId    : false
        },
        {
            plaziName     : 'authorityYear',
            zenodoName    : '',
            sqlType       : 'TEXT',
            cheerioElement: '$("subSubSection[type=nomenclature] taxonomicName").attr("authorityYear")',
            description   : 'The year when the taxon name was published',
            queryable     : 'equal',
            queryString   : 'authorityYear',
            validation    : 'Joi.string().description(`${d}`).optional()',
            resourceId    : false
        },
        {
            plaziName     : 'kingdom',
            zenodoName    : 'subjects',
            sqlType       : 'TEXT',
            cheerioElement: '$("subSubSection[type=nomenclature] taxonomicName").attr("kingdom")',
            description   : 'The higher category of the taxonomicName',
            queryable     : 'like',
            queryString   : 'kingdom',
            validation    : 'Joi.string().description(`${d}`).optional()',
            resourceId    : false
        },
        {
            plaziName     : 'phylum',
            zenodoName    : 'subjects',
            sqlType       : 'TEXT',
            cheerioElement: '$("subSubSection[type=nomenclature] taxonomicName").attr("phylum")',
            description   : 'The higher category of the taxonomicName',
            queryable     : 'like',
            queryString   : 'phylum',
            validation    : 'Joi.string().description(`${d}`).optional()',
            resourceId    : false
        },
        {
            plaziName     : 'order',
            zenodoName    : 'subjects',
            sqlName       : '"order"',
            sqlType       : 'TEXT',
            cheerioElement: '$("subSubSection[type=nomenclature] taxonomicName").attr("order")',
            description   : 'The higher category of the taxonomicName',
            queryable     : 'like',
            queryString   : 'order',
            validation    : 'Joi.string().description(`${d}`).optional()',
            resourceId    : false
        },
        {
            plaziName     : 'family',
            zenodoName    : 'subjects',
            sqlType       : 'TEXT',
            cheerioElement: '$("subSubSection[type=nomenclature] taxonomicName").attr("family")',
            description   : 'The higher category of the taxonomicName',
            queryable     : 'like',
            queryString   : 'family',
            validation    : 'Joi.string().description(`${d}`).optional()',
            resourceId    : false
        },
        {
            plaziName     : 'genus',
            zenodoName    : 'subjects',
            sqlType       : 'TEXT',
            cheerioElement: '$("subSubSection[type=nomenclature] taxonomicName").attr("genus")',
            description   : 'The higher category of the taxonomicName',
            queryable     : 'like',
            queryString   : 'genus',
            validation    : 'Joi.string().description(`${d}`).optional()',
            resourceId    : false
        },
        {
            plaziName     : 'species',
            zenodoName    : 'subjects',
            sqlType       : 'TEXT',
            cheerioElement: '$("subSubSection[type=nomenclature] taxonomicName").attr("species")',
            description   : 'The higher category of the taxonomicName',
            queryable     : 'like',
            queryString   : 'species',
            validation    : 'Joi.string().description(`${d}`).optional()',
            resourceId    : false
        },
        {
            plaziName     : 'status',
            zenodoName    : 'subjects',
            sqlType       : 'TEXT',
            cheerioElement: '$("subSubSection[type=nomenclature] taxonomicName").attr("status")',
            description   : 'The descriptor for the taxonomic status proposed by a given treatment (can be new species, or new combination, or new combination and new synonym)',
            queryable     : 'like',
            queryString   : 'status',
            validation    : 'Joi.string().description(`${d}`).optional()',
            resourceId    : false
        },
        {
            plaziName     : 'taxonomicNameLabel',
            zenodoName    : 'subjects',
            sqlType       : 'TEXT',
            cheerioElement: '$("subSubSection[type=nomenclature] taxonomicName").text()',
            description   : 'The Taxonomic Name Label, present if the species is a new species',
            queryable     : 'like',
            queryString   : 'taxonomicNameLabel',
            validation    : 'Joi.string().description(`${d}`).optional()',
            resourceId    : false
        },
        {
            plaziName     : 'rank',
            zenodoName    : 'subjects',
            sqlName       : 'treatments.rank',
            sqlType       : 'TEXT',
            cheerioElement: '$("subSubSection[type=nomenclature] taxonomicName").attr("rank")',
            description   : 'The taxonomic rank of the taxon, e.g. species, family',
            queryable     : 'like',
            queryString   : 'rank',
            validation    : 'Joi.string().description(`${d}`).optional()',
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
        },
        {
            plaziName     : 'fulltext',
            zenodoName    : '',
            sqlName       : 'vtreatments',
            table         : 'vtreatments ON treatments.treatmentId = vtreatments.treatmentId',
            sqlType       : 'TEXT',
            cheerioElement: '$("treatment").text()',
            description   : 'The full text of the treatment',
            queryable     : 'match',
            resourceId    : false,
            queryString   : 'q',
            validation    : 'Joi.string().description(`${d}`).optional()',
            fts           : { 
                table: 'vtreatments', 
                join: 'vtreatments ON treatments.treatmentId = vtreatments.treatmentId' 
            }
        },
        
        /***************** */

        {
            plaziName     : 'format',
            zenodoName    : '',
            sqlType       : '',
            cheerioElement: '',
            description   : 'Response format',
            queryable     : '',
            queryString   : 'format',
            validation    : 'Joi.string().valid("xml").description(`${d}`).optional()',
            resourceId    : false
        },
        {
            plaziName     : 'xml',
            zenodoName    : '',
            sqlType       : '',
            cheerioElement: '',
            description   : 'Whether or not to fetch xml',
            queryable     : '',
            queryString   : 'xml',
            validation    : 'Joi.boolean().default(false).description(`${d}`)',
            resourceId    : false
        },
        {
            plaziName     : 'sortBy',
            zenodoName    : '',
            sqlType       : '',
            cheerioElement: '',
            description   : 'sort column:sort order',
            queryable     : '',
            queryString   : 'sortBy',
            validation    : 'Joi.string().default("treatmentId:ASC").description(`${d}`).optional()',
            resourceId    : false
        }
    ],

    figureCitations: [
        {
            plaziName     : 'figureCitationId',
            zenodoName    : '',
            sqlType       : 'TEXT NOT NULL UNIQUE',
            cheerioElement: '$("figureCitation").attr("id")',
            description   : 'The unique ID of the figureCitation',
            queryable     : 'equal',
            queryString   : 'figureCitationId',
            validation    : 'Joi.string().description(`${d}`).optional()',
            resourceId    : true
        },
        {
            plaziName     : 'captionText',
            zenodoName    : 'relatedIdentifiers[cites]',
            sqlType       : 'TEXT',
            cheerioElement: '$("figureCitation").attr("captionText")',
            description   : 'The figure cited by this treatment',
            queryable     : 'match',
            queryString   : 'q',
            validation    : 'Joi.string().description(`${d}`).optional()',
            resourceId    : false,
            fts           : { 
                table: 'vfigurecitations', 
                join: 'vfigurecitations ON figureCitations.figureCitationId = vfigurecitations.figureCitationId' 
            }
        },
        {
            plaziName     : 'httpUri',
            zenodoName    : 'relatedIdentifiers[cites]',
            sqlType       : 'TEXT',
            cheerioElement: '$("figureCitation").attr("httpUri")',
            description   : 'The URI of the figure cited by this treatment',
            queryable     : '',
            queryString   : '',
            validation    : '',
            resourceId    : false
        },
        {
            plaziName     : 'thumbnailUri',
            zenodoName    : '',
            sqlType       : 'TEXT',
            cheerioElement: '',
            description   : 'The thumbnail of the figure cited by this treatment',
            queryable     : '',
            queryString   : '',
            validation    : '',
            resourceId    : false
        }
    ],

    bibRefCitations: [
        {
            plaziName     : 'bibRefCitationId',
            zenodoName    : '',
            sqlType       : 'TEXT NOT NULL UNIQUE',
            cheerioElement: '$("bibRefCitation").attr("id")',
            description   : 'The unique ID of the bibRefCitation',
            queryable     : 'equal',
            queryString   : 'bibRefCitationId',
            validation    : 'Joi.string().description(`${d}`).optional()',
            resourceId    : true
        },
        {
            plaziName     : 'refString',
            zenodoName    : 'relatedIdentifiers[cites]',
            sqlType       : 'TEXT',
            cheerioElement: '$("bibRefCitation").attr("refString")',
            description   : 'The reference cited by this treatment',
            queryable     : 'match',
            queryString   : 'q',
            validation    : 'Joi.string().description(`${d}`).optional()',
            resourceId    : false,
            fts           : { 
                table: 'vbibrefcitations', 
                join: 'vbibrefcitations ON bibRefCitations.bibRefCitationId = vbibrefcitations.bibRefCitationId' 
            }
        },
        {
            plaziName     : 'type',
            zenodoName    : 'relatedIdentifiers[cites]',
            sqlType       : 'TEXT',
            cheerioElement: '$("bibRefCitation").attr("type")',
            description   : 'The type of reference cited by this treatment',
            queryable     : '',
            queryString   : '',
            validation    : '',
            resourceId    : false
        },
        {
            plaziName     : 'year',
            zenodoName    : 'relatedIdentifiers[cites]',
            sqlType       : 'TEXT',
            cheerioElement: '$("bibRefCitation").attr("year")',
            description   : 'The year of the reference cited by this treatment',
            queryable     : '',
            queryString   : '',
            validation    : '',
            resourceId    : false
        }
    ],

    treatmentCitations: [
        {
            plaziName     : 'treatmentCitationId',
            zenodoName    : '',
            sqlType       : 'TEXT NOT NULL UNIQUE',
            cheerioElement: '',
            description   : 'The unique ID of the treatmentCitation',
            queryable     : 'equal',
            queryString   : 'treatmentCitationId',
            validation    : 'Joi.string().description(`${d}`).optional()',
            resourceId    : true
        },
        {
            plaziName     : 'treatmentCitation',
            zenodoName    : 'subjects; AND if there is a DOI for the treatmentCitation, relatedIdentifiers[cites]',
            sqlType       : 'TEXT',
            cheerioElement: '$("subSubSection[type=reference_group] treatmentCitationGroup taxonomicName").text() + " " + $("subSubSection[type=reference_Group] treatmentCitationGroup taxonomicName").attr("authority") + " sec. " + $("subSubSection[type=reference_Group] treatmentCitationGroup bibRefCitation").text()',
            description   : 'The taxonomic name and the author of the species, plus the author of the treatment being cited',
            queryable     : '',
            queryString   : '',
            validation    : 'Joi.string().description(`${d}`).optional()',
            resourceId    : false
        },
        {
            plaziName     : 'refString',
            zenodoName    : 'relatedIdentifiers[cites]',
            sqlType       : 'TEXT',
            cheerioElement: '$("subSubSection[type=referenceGroup] treatmentCitationGroup treatmentCitation bibRefCitation").attr("refString")',
            description   : 'The bibliographic reference string of the treatments cited by this treatment',
            queryable     : '',
            queryString   : '',
            validation    : 'Joi.string().description(`${d}`).optional()',
            resourceId    : false
        }
    ],

    materialsCitations: [
        {
            plaziName     : 'materialsCitationId',
            zenodoName    : '',
            sqlType       : 'TEXT NOT NULL UNIQUE',
            cheerioElement: '$("materialsCitation").attr("id")',
            description   : 'The unique ID of the materialsCitation',
            queryable     : 'equal',
            queryString   : 'materialsCitationId',
            validation    : 'Joi.string().description(`${d}`).optional()',
            resourceId    : true
        },
        {
            plaziName     : 'collectingDate',
            zenodoName    : 'date[type=collected] + range parsing',
            sqlType       : 'TEXT',
            cheerioElement: '$("materialsCitation").attr("collectingDate")',
            description   : 'The date when the specimen was collected',
            queryable     : 'equal',
            queryString   : 'collectingDate',
            validation    : 'Joi.string().description(`${d}`).optional()',
            resourceId    : false
        },
        {
            plaziName     : 'collectionCode',
            zenodoName    : 'subjects',
            sqlType       : 'TEXT',
            cheerioElement: '$("materialsCitation").attr("collectionCode")',
            description   : 'The collection code for a natural history collection',
            queryable     : 'equal',
            queryString   : 'collectionCode',
            validation    : 'Joi.string().description(`${d}`).optional()',
            resourceId    : false
        },
        {
            plaziName     : 'collectorName',
            zenodoName    : 'contributor=collector',
            sqlType       : 'TEXT',
            cheerioElement: '$("materialsCitation").attr("collectorName")',
            description   : 'The person who collected the specimen',
            queryable     : 'like',
            queryString   : 'collectorName',
            validation    : 'Joi.string().description(`${d}`).optional()',
            resourceId    : false
        },
        {
            plaziName     : 'country',
            zenodoName    : 'geo_place',
            sqlType       : 'TEXT',
            cheerioElement: '$("materialsCitation").attr("country")',
            description   : 'The country where the specimen was collected',
            queryable     : 'like',
            queryString   : 'country',
            validation    : 'Joi.string().description(`${d}`).optional()',
            resourceId    : false
        },
        {
            plaziName     : 'collectingRegion',
            zenodoName    : 'geo_place',
            sqlType       : 'TEXT',
            cheerioElement: '$("materialsCitation").attr("collectingRegion")',
            description   : 'The geographic region where the specimen was collected',
            queryable     : 'like',
            queryString   : 'collectingRegion',
            validation    : 'Joi.string().description(`${d}`).optional()',
            resourceId    : false
        },
        {
            plaziName     : 'municipality',
            zenodoName    : 'geo_place',
            sqlType       : 'TEXT',
            cheerioElement: '$("materialsCitation").attr("municipality")',
            description   : 'A lower administrative region',
            queryable     : 'like',
            queryString   : 'municipality',
            validation    : 'Joi.string().description(`${d}`).optional()',
            resourceId    : false
        },
        {
            plaziName     : 'county',
            zenodoName    : 'geo_place',
            sqlType       : 'TEXT',
            cheerioElement: '$("materialsCitation").attr("county")',
            description   : 'The county where the specimen was collected',
            queryable     : 'like',
            queryString   : 'county',
            validation    : 'Joi.string().description(`${d}`).optional()',
            resourceId    : false
        },
        {
            plaziName     : 'stateProvince',
            zenodoName    : 'geo_place',
            sqlType       : 'TEXT',
            cheerioElement: '$("materialsCitation").attr("stateProvince")',
            description   : 'The state or province where the specimen was collected',
            queryable     : 'like',
            queryString   : 'stateProvince',
            validation    : 'Joi.string().description(`${d}`).optional()',
            resourceId    : false
        },
        {
            plaziName     : 'location',
            zenodoName    : 'geo_place',
            sqlType       : 'TEXT',
            cheerioElement: '$("materialsCitation").attr("location")',
            description   : 'The location where the specimen was collected',
            queryable     : 'like',
            queryString   : 'location',
            validation    : 'Joi.string().description(`${d}`).optional()',
            resourceId    : false
        },
        {
            plaziName     : 'locationDeviation',
            zenodoName    : 'geo_place',
            sqlType       : 'TEXT',
            cheerioElement: '$("materialsCitation").attr("locationDeviation")',
            description   : 'The distance to the nearest location, e.g. 23km NW from…',
            queryable     : '',
            queryString   : '',
            validation    : '',
            resourceId    : false
        },
        {
            plaziName     : 'specimenCountFemale',
            zenodoName    : '',
            sqlType       : 'TEXT',
            cheerioElement: '$("materialsCitation").attr("specimenCount-female")',
            description   : 'The number of listed female specimens',
            queryable     : '',
            queryString   : '',
            validation    : '',
            resourceId    : false
        },
        {
            plaziName     : 'specimenCountMale',
            zenodoName    : '',
            sqlType       : 'TEXT',
            cheerioElement: '$("materialsCitation").attr("specimenCount-male")',
            description   : 'The number of listed male specimens',
            queryable     : '',
            queryString   : '',
            validation    : '',
            resourceId    : false
        },
        {
            plaziName     : 'specimenCount',
            zenodoName    : '',
            sqlType       : 'TEXT',
            cheerioElement: '$("materialsCitation").attr("specimenCount")',
            description   : 'The number of listed specimens',
            queryable     : '',
            queryString   : '',
            validation    : '',
            resourceId    : false
        },
        {
            plaziName     : 'specimenCode',
            zenodoName    : 'subjects',
            sqlType       : 'TEXT',
            cheerioElement: '$("materialsCitation").attr("specimenCode")',
            description   : 'The code of the specimen',
            queryable     : 'equal',
            queryString   : 'specimenCode',
            validation    : 'Joi.string().description(`${d}`).optional()',
            resourceId    : false
        },
        {
            plaziName     : 'typeStatus',
            zenodoName    : 'subjects',
            sqlType       : 'TEXT',
            cheerioElement: '$("materialsCitation").attr("typeStatus")',
            description   : 'The nomenclatural status of the specimen, e.g. holotype, paratype',
            queryable     : 'equal',
            queryString   : 'typeStatus',
            validation    : 'Joi.string().description(`${d}`).optional()',
            resourceId    : false
        },
        {
            plaziName     : 'determinerName',
            zenodoName    : '',
            sqlType       : 'TEXT',
            cheerioElement: '$("materialsCitation").attr("determinerName")',
            description   : 'The person or agent who identified the specimen',
            queryable     : 'like',
            queryString   : 'determinerName',
            validation    : 'Joi.string().description(`${d}`).optional()',
            resourceId    : false
        },
        {
            plaziName     : 'collectedFrom',
            zenodoName    : '',
            sqlType       : 'TEXT',
            cheerioElement: '$("materialsCitation").attr("collectedFrom")',
            description   : 'The substrate where the specimen has been collected, e.g. leaf, flower',
            queryable     : 'like',
            queryString   : 'collectedFrom',
            validation    : 'Joi.string().description(`${d}`).optional()',
            resourceId    : false
        },
        {
            plaziName     : 'collectingMethod',
            zenodoName    : 'description[method]',
            sqlType       : 'TEXT',
            cheerioElement: '$("materialsCitation").attr("collectingMethod")',
            description   : 'The method used for collecting the specimen',
            queryable     : 'like',
            queryString   : 'collectingMethod',
            validation    : 'Joi.string().description(`${d}`).optional()',
            resourceId    : false
        },
        {
            plaziName     : 'latitude',
            zenodoName    : 'geo_lat',
            sqlType       : 'TEXT',
            cheerioElement: '$("materialsCitation").attr("latitude")',
            description   : 'Geographic coordinates of the location where the specimen was collected',
            queryable     : 'equal',
            queryString   : 'latitude',
            validation    : 'Joi.number().min(-90).max(90).description(`${d}`).optional()',
            resourceId    : false
        },
        {
            plaziName     : 'longitude',
            zenodoName    : 'geo_lon',
            sqlType       : 'TEXT',
            cheerioElement: '$("materialsCitation").attr("longitude")',
            description   : 'Geographic coordinates of the location where the specimen was collected',
            queryable     : 'equal',
            queryString   : 'longitude',
            validation    : 'Joi.number().min(-180).max(180).description(`${d}`).optional()',
            resourceId    : false
        },
        {
            plaziName     : 'elevation',
            zenodoName    : '',
            sqlType       : 'TEXT',
            cheerioElement: '$("materialsCitation").attr("elevation")',
            description   : 'Elevation of the location where the specimen was collected',
            queryable     : 'equal',
            queryString   : 'elevation',
            validation    : 'Joi.string().description(`${d}`).optional()',
            resourceId    : false
        },
        {
            plaziName     : 'httpUri',
            zenodoName    : 'relatedIdentifiers[hasPart]',
            sqlType       : 'TEXT',
            cheerioElement: '$("materialsCitation").attr("httpUri")',
            description   : 'The persistent identifier of the specimen',
            queryable     : '',
            queryString   : '',
            validation    : '',
            resourceId    : false
        }
    ],

    images: [
        {
            plaziName     : 'type',
            zenodoName    : 'publication_subtypes',
            sqlType       : '',
            cheerioElement: '',
            description   : 'The image subtype; defaults to <b>"all"</b>',
            queryable     : 'equal',
            queryString   : 'type',
            validation    : 'Joi.string().valid("all", "figure", "photo", "drawing", "diagram", "plot", "other").default("all").description(`${d}`).optional()',
            resourceId    : false
        }
    ],

    publications: [
        {
            plaziName     : 'type',
            zenodoName    : 'image_subtypes',
            sqlType       : '',
            cheerioElement: '',
            description   : 'The publication subtype; defaults to <b>"all"</b>',
            queryable     : 'equal',
            queryString   : 'type',
            validation    : 'Joi.string().valid("all", "article", "report", "book", "thesis", "section", "workingpaper", "preprint").default("all").description(`${d}`).optional()',
            resourceId    : false
        }
    ]
};

const zenodoResources = ['images', 'publications'];
const zenodeoResources = ['figureCitations', 'bibRefCitations', 'materialsCitations', 'treatmentCitations'];

module.exports = (function() {
    for (let resource in dd) {
        dd[resource].push(...commonQueryParams);

        if (zenodoResources.includes(resource)) {
            dd[resource].push(...commonZenodoQueryParams);
        }
        else {
            if (resource !== 'treatments') {
                dd[resource].push(...commonZenodeoQueryParams);
            }
        }
    }

    return dd;
})();