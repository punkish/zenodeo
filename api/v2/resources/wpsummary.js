'use strict';

//const ib = require('wiki-infobox');
//const Wreck = require('wreck');
const wiki = require('wikijs').default;
//const Config = require('../../../config.js');
const ResponseMessages = require('../../response-messages');
const Utils = require('../utils.js');
const Debug = require('debug')('v2: wpsummary');
const Cache = Utils.cache('wpsummary');
 
const newQuery = async function(zenodeoUri, term) {
    let result = await wiki().page(term).then(page => page.summary()).then(summary => { return summary })
    return Utils.packageResult(zenodeoUri, result);
}

const wpsummary = {

    method: 'GET',
    path: 'wpsummary/{term}',
    handler: async function(request, h) {

        const [ZenodoUri, zenodeoUri, cacheKey] = Utils.makeIncomingUri(request, 'wpsummary');
        const term = request.params.term;
        let result;

        // perform a new query only if refreshCache is true
        if (request.query.refreshCache) {
            result = newQuery(zenodeoUri, term);
            Utils.updateCache(Cache, cacheKey, result);
            return result;
        }

        // serve result from cache if it exists in cache
        else {
            if (result = Cache.getSync(cacheKey)) {
                return result;
            }
            else {
                result = newQuery(zenodeoUri, term);
                Utils.updateCache(Cache, cacheKey, result);
                return result;
            }
        }
        
    },

    config: {
        description: "wikipedia summary",
        tags: ['wikipedia', 'summary', 'api'],
        plugins: {
            'hapi-swagger': {
                order: 5,
                responseMessages: ResponseMessages
            }
        },
        validate: {},
        notes: [
            'Summary from the Wikipedia.',
        ]
    }
};

module.exports = wpsummary;