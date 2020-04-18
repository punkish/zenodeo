'use strict';

module.exports = [
    // {
    //     plaziName     : 'id',
    //     zenodoName    : '',
    //     sqlType       : 'INTEGER PRIMARY KEY',
    //     cheerioElement: '',
    //     description   : 'pk',
    //     queryable     : '',
    //     queryString   : '',
    //     validation    : '',
    //     resourceId    : false
    // },
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
        sqlName       : 'vfigurecitations',
        table         : 'vfigurecitations ON figureCitations.figureCitationId = vfigurecitations.figureCitationId',
        sqlType       : 'TEXT',
        cheerioElement: '$("figureCitation").attr("captionText")',
        description   : 'The figure cited by this treatment',
        queryable     : 'match',
        queryString   : 'q',
        validation    : 'Joi.string().description(`${d}`).optional()',
        resourceId    : false
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
];