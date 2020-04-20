'use strict';

module.exports = [
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
];