'use strict';

module.exports = [
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
];