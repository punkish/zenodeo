'use strict';

/***********************************************************************
 * 
 * Data dictionary for bibRefCitations from Zenodeo
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
            description   : 'pk',
            queryable     : '',
            queryString   : '',
            validation    : '',
            resourceId    : false
        },
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
            sqlName       : 'vbibrefcitations',
            table         : 'vbibrefcitations ON bibRefCitations.bibRefCitationId = vbibrefcitations.bibRefCitationId',
            sqlType       : 'TEXT',
            cheerioElement: '$("bibRefCitation").attr("refString")',
            description   : 'The reference cited by this treatment',
            queryable     : 'match',
            queryString   : 'q',
            validation    : 'Joi.string().description(`${d}`).optional()',
            resourceId    : false
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
    ]
};