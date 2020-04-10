'use strict';

module.exports = [
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
        plaziName     : 'treatmentAuthorId',
        zenodoName    : '',
        sqlType       : 'TEXT NOT NULL UNIQUE',
        cheerioElement: '$("treatmentAuthor").attr("id")',
        description   : 'The unique ID of the treatmentAuthor',
        queryable     : 'equal',
        queryString   : 'treatmentAuthorId',
        validation    : 'Joi.string().description(`${d}`).optional()',
        resourceId    : true
    },
    {
        plaziName     : 'treatmentAuthor',
        zenodoName    : 'creators',
        sqlType       : 'TEXT',
        cheerioElement: 'mods\\\\:namePart',
        description   : 'The author of this treatment (author of the article is used if no treatment authority is found)',
        queryable     : 'like',
        queryString   : 'treatmentAuthor',
        validation    : 'Joi.string().description(`${d}`).optional()',
        resourceId    : false
    }
];