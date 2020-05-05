'use strict';

/***********************************************************************
 * 
 * Data dictionary for treatments from Zenodeo
 * 
 **********************************************************************/

module.exports = {
    cache: true,
    fields: [
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
            description   : 'The author(s) of the treatment (not necessarily the same as the authors of the journal article, but omitted if same as article authors)',
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
            plaziName     : 'q',
            zenodoName    : '',
            sqlName       : 'vtreatments',
            table         : 'vtreatments ON treatments.treatmentId = vtreatments.treatmentId',
            sqlType       : 'TEXT',
            cheerioElement: '$("treatment").text()',
            description   : 'The full text of the treatment',
            queryable     : 'match',
            resourceId    : false,
            queryString   : 'q',
            validation    : 'Joi.string().description(`${d}`).optional()'
        },
        {
            plaziName     : 'author',
            zenodoName    : '',
            sqlName       : 'treatmentAuthors.treatmentAuthor',
            table         : 'treatmentAuthors ON treatments.treatmentId = treatmentAuthors.treatmentId',
            sqlType       : 'TEXT',
            cheerioElement: '',
            description   : 'The author(s) of the article (not necessarily the same as the author of the treatment)',
            queryable     : 'like',
            resourceId    : false,
            queryString   : 'author',
            validation    : 'Joi.string().description(`${d}`).optional()'
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
    ]
};