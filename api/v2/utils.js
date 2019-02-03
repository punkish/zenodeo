const Crypto = require('crypto');
const Joi = require('joi');
const ResponseMessages = require('../response-messages');
const Config = require('../../config.js');
const Debug = require('debug')('v2: utils');
const Schema = require('./schema.js');

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

const dateOptions = { 
    weekday: 'short', 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric'
};

const utils = {
    createCacheKey: function(str) {
        return Crypto
            .createHash('md5')
            .update(str.toLowerCase(), 'utf8')
            .digest('hex');
    },

    updateCache: async function(cache, cacheKey, result) {

        const r = await result;
    
        // old result already exists in cache
        if (cache.getSync(cacheKey)) {
                
            // delete old cached value
            cache.deleteSync(cacheKey);
        }

        // cache the new result
        cache.putSync(cacheKey, r);
    },

    cache: function(name) {
        return require('persistent-cache')({
            base: Config.cacheBase,
            name: name
        })
    },

    find: function(pattern, source) {
        const re = new RegExp(`^${pattern}`, 'i');
        const res = data[source].filter(function(element) {
            return (element.search(re) > -1)
        });
        return(res);
    },

    errorMsg: {
        "data": [],
        "error": "nothing found"
    },

    packageResult: function(uri, response) {

        return {
            "uri": uri,
            "retrieved": (new Date()).toLocaleDateString("en-US", dateOptions),
            "response": response,
        }
    },

    makeIncomingUri: function(request, resource) {

        let ZenodoUri = `${Config.zenodo}/`;
        let zenodeoUri = `${Config.zenodeo}/v2/${resource}/`;

        if (resource === 'communities') {
            ZenodoUri += `${resource}/`;

            if (request.query.name !== 'all') {
                ZenodoUri += request.query.name;
            }
        }
        else if (resource === 'record') {
            ZenodoUri += `records/${request.params.id}/`;
        }
        else if (resource === 'treatment') {
            ZenodoUri = `${Config.tb}${request.params.id}`;
            zenodeoUri += `${request.params.id}`;
        }
        else if (resource === 'wpsummary') {
            zenodeoUri += `${request.params.term}`;
        }
        else {
            ZenodoUri += `${resource}/`;
        }
        
        let qry = '';
        if (request.url.query) {
            let q = Object.keys(request.url.query).sort();

            // remove 'refreshCache' from the query
            q.splice(q.indexOf('refreshCache'), 1);

            let qtmp = q.map(el => { 
                if (resource !== 'communities') {
                    if (el === 'communities') {
                        if (request.url.query[el] === 'all') {
                            return 'communities=biosyslit&communities=icedig';
                        }
                    }
                }

                return el + '=' + request.url.query[el] 
            });

            qry = qtmp.join('&');

            if (resource !== 'communities') {
                ZenodoUri += `?${qry}`;
            }
        }

        
        if (qry) {
            zenodeoUri += `?${qry}`;
        }
        const cacheKey = this.createCacheKey(zenodeoUri);

        Debug(`zenodeoUri: ${zenodeoUri}`);
        return [ZenodoUri, zenodeoUri, cacheKey];
    },

    jsonHeader: "application/json"
};

module.exports = utils;