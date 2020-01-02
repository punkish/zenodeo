const Crypto = require('crypto');
const Joi = require('@hapi/joi');
const ResponseMessages = require('../responseMessages');

const config = require('config');
const cachePath = config.get('cache.path');
const cacheName = config.get('cache.v1.name')
const uriRemote = config.get('uri.remote');
const authors = config.get('data.authors');
const keywords = config.get('data.keywords');
const taxa = config.get('data.taxa');
const families = config.get('data.families');

const find = function(pattern, source) {
    const re = new RegExp(`^${pattern}`, 'i');
    const res = data[source].filter(function(element) {
        return (element.search(re) > -1)
    });
    return(res);
};


const data = {
    authors: require(authors),
    keywords: require(keywords),
    taxa: require(taxa),
    families: require(families),
}

const utils = {

    cache: function(name) {
        const Cache = require('persistent-cache')({
            base: cachePath + '/' + cacheName,
            name: name
        })

        return Cache
    },

    makeUriAndCacheKey: function (request, resource) {

        const uris = {
            '/': {
                local: {
                    path: '/',
                    params: [],
                    query: []
                },
                remote: {
                    path: '/communities/biosyslit',
                    params: [],
                    query: []
                }
            },
            files: {
                local: {
                    path: '/files',
                    params: [ 'file_id' ],
                    query: []
                },
                remote: {
                    path: '/files',
                    params: [ 'file_id' ],
                    query: []
                }
            },
            record: {
                local: {
                    path: '/records',
                    params: [ 'id' ],
                    query: [ 'images' ]
                },
                remote: {
                    path: '/records',
                    params: [ 'id' ],
                    query: []
                }
            },
            records: {
                local: {
                    path: '/records/',
                    params: [],
                    query: [
                        'access_right',
                        'communities',
                        'file_type',
                        'images',
                        'image_subtype',
                        'keywords',
                        'page',
                        'publication_subtype', 
                        'q', 
                        'size',
                        'summary',
                        'type'
                    ]
                },
                remote: {
                    path: '/records/',
                    params: [],
                    query: [
                        'access_right',
                        'communities',
                        'file_type',
                        'image_subtype',
                        'keywords',
                        'page',
                        'publication_subtype', 
                        'q', 
                        'size',
                        'type'
                    ]
                }
            },
            treatment: {
                local: {
                    path: '/treatment',
                    params: [ 'id' ],
                    query: []
                },
                remote: {
                    path: '/treatment',
                    params: [ 'id' ],
                    query: []
                }
            }
        };

        let local = uris[resource].local.path;
        const paramsLocal = uris[resource].local.params;

        if (paramsLocal.length) {
            const paramsArrLocal = [];

            paramsLocal.forEach(param => {
                paramsArrLocal.push( encodeURIComponent(request.params[param]) )
            })

            local += '/' + paramsArrLocal.join('/')
        }

        const queryLocal = uris[resource].local.query;
        
        if (queryLocal.length) {
            const queryArrLocal = [];

            queryLocal.forEach(param => {
                if (request.query[param]) {
                    queryArrLocal.push(`${param}=${encodeURIComponent(request.query[param])}`)
                }
            })
    
            if (queryArrLocal.length) {
                local += '?' + queryArrLocal.join('&')
            }
            
        }
    
        let remote = uriRemote + uris[resource].remote.path
        const paramsRemote = uris[resource].remote.params;

        if (paramsRemote.length) {
            const paramsArrRemote = [];

            paramsRemote.forEach(param => {
                paramsArrRemote.push( encodeURIComponent(request.params[param]) )
            })

            remote += '/' + paramsArrRemote.join('/')
        }

        const queryRemote = uris[resource].remote.query;
    
        if (queryRemote.length) {
            const queryArrRemote = [];

            queryRemote.forEach(param => {
                if (request.query[param]) {
                    queryArrRemote.push(`${param}=${encodeURIComponent(request.query[param])}`)
                }
            })
    
            if (queryArrRemote.length) {
                remote += '?' + queryArrRemote.join('&')
            }
            
        }
    
        const cacheKey = Crypto
            .createHash('md5')
            .update(local.toLowerCase(), 'utf8')
            .digest('hex');
    
        //console.log(local, cacheKey, remote)
        return [ cacheKey, remote ]
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

    jsonHeader: "application/json"
};

module.exports = utils;