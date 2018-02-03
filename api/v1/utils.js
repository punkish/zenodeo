const Crypto = require('crypto');
const Joi = require('joi');
const ResponseMessages = require('../response-messages');

const find = function(pattern, source) {
    const re = new RegExp(`^${pattern}`, 'i');
    const res = data[source].filter(function(element) {
        return (element.search(re) > -1)
    });
    return(res);
};

const data = {
    authors: require('../../data/authors.js'),
    taxa: require('../../data/taxa.min.js'),
    families: require('../../data/families.min.js'),
    keywords: require('../../data/keywords.js')
};

const utils = {
    createCacheKey: function(str) {
        return Crypto
            .createHash('md5')
            .update(str.toLowerCase(), 'utf8')
            .digest('hex');
    },

    facets: function(facet) {
        return {

            method: 'GET',
        
            path: `/${facet}/{term?}`,
        
            config: {
                description: facet,
                tags: [facet, 'api'],
                plugins: {
                    'hapi-swagger': {
                        order: 2,
                        responseMessages: ResponseMessages
                    }
                },
                validate: {
                    params: {
                        term: Joi.string()
                    }
                },
                notes: [
                    `This route fetches ${facet} matching the search term (the portion after /${facet}/ in the URI).`
                ]
            },
            
            handler: function (request, reply) {
                if (request.params.term) {
                    reply(find(request.params.term, facet));
                }
            }
        };
    }
};

module.exports = utils;