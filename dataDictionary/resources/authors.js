'use strict';

/***********************************************************************
 * 
 * Data dictionary for authors (used for lookups) from Zenodeo
 * 
 **********************************************************************/

module.exports = {
    cache: false,
    fields: [
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
    ]
};
