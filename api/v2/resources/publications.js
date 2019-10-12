'use strict';

const Schema = require('../schema.js');
const ResponseMessages = require('../../responseMessages');
const debug = require('debug')('v2:images');
const config = require('config');
const Utils = require('../utils');

const uriZenodeo = config.get('uri.zenodeo') + '/v2';
const cacheOn = config.get('cache.v2.on');

const Wreck = require('wreck');
const uriZenodo = config.get('uri.remote') + '/records/';

module.exports = {
    plugin: {
        name: 'publications2',
        register: async function(server, options) {

            const cache = Utils.makeCache({
                server: server, 
                options: options, 
                query: getRecords,  
                segment: 'publications2'
            });

            // binds cache to every route registered  
            // **within this plugin** after this line
            server.bind({ cache });

            server.route([{ 
                path: '/publications', 
                method: 'GET', 
                config: {
                    description: "Fetch publications from Zenodo",
                    tags: ['publications', 'api'],
                    plugins: {
                        'hapi-swagger': {
                            order: 8,
                            responseMessages: ResponseMessages
                        }
                    },
                    validate: Schema.publications,
                    notes: [
                        'This is the main route for fetching publications matching the provided query parameters.',
                    ]
                },
                handler 
            }]);
        },
    },
};

const handler = async function(request, h) {

    // cacheKey is the URL query without the refreshCache param.
    // The default params, if any, are used in making the cacheKey.
    // The default params are also used in queryObject to actually 
    // perform the query. However, the default params are not used 
    // to determine what kind of query to perform.
    const cacheKey = Utils.makeCacheKey(request);
    debug(`cacheKey: ${cacheKey}`);

    if (cacheOn) {
        if (request.query.refreshCache === 'true') {
            debug('forcing refreshCache')
            this.cache.drop(cacheKey);
        }

        return this.cache.get(cacheKey);
    }
    else {
        return getRecords(cacheKey);
    }
};

const getRecords = function(cacheKey) {
    const queryObject = Utils.makeQueryObject(cacheKey);
    debug(`queryObject: ${JSON.stringify(queryObject)}`);

    // An id is present. The query is for a specific
    // record. All other query params are ignored
    if (queryObject.id) {
        return getOneRecord(queryObject);
    }
    
    // More complicated queries with search parameters
    else {
        return getManyRecords(queryObject)
    }
};

const getOneRecord = async function(queryObject) {    
    let data;
    const uriRemote = uriZenodo + queryObject.id;
    try {
        debug(`querying ${uriRemote}`);
        const {res, payload} =  await Wreck.get(uriRemote);
        data = await JSON.parse(payload) || { 'num-of-records': 0 };
    }
    catch(err) {
        console.error(err);
    }
    
    data['search-criteria'] = queryObject;
    data._links = Utils.makeSelfLink({
        uri: uriZenodeo, 
        resource: 'images', 
        queryString: Object.entries(queryObject)
            .map(e => e[0] + '=' + e[1])
            .sort()
            .join('&')
    });

    return data;
};

const getManyRecords = async function(queryObject) {

    const tmp = [];
    for (let k in queryObject) {
        if (k !== 'refreshCache') {
            tmp.push(`${k}=${queryObject[k]}`);
        }
    }
    const queryString = tmp.join('&');
    
    const uriRemote = `${uriZenodo}?${queryString}&communities=biosyslit&type=publication&access_right=open`;
    const limit = 30;

    try {
        debug(`querying ${uriRemote}`);
        const {res, payload} =  await Wreck.get(uriRemote);
        const result = await JSON.parse(payload);
        const total = result.hits.total;
        const hits = result.hits.hits;
        const num = hits.length;

        //const byAccessRight = result.aggregations.access_right.buckets;
        const byKeywords = result.aggregations.keywords.buckets;
        const statistics = {};
        byKeywords.forEach(k => {
            statistics[k.key] = k.doc_count;
        });

        const page = queryObject.page ? parseInt(queryObject.page) : 1;

        //const offset = page * 30;

        const from = ((page - 1) * 30) + 1;
        const to = num < limit ? from + num - 1 : from + limit - 1;

        const records = [];

        debug(`found ${total} open records… now getting their images`);
        debug(`number of images: ${hits.length}`);

        hits.forEach(h => {
            records.push({
                conceptrecid: h.conceptrecid,
                created: h.created,
                doi: h.doi,
                files: h.files.forEach(f => f.links.self),
                id: h.id,
                html: h.links.latest_html,
                thumbs: h.links.thumbs,
                creators: h.metadata.creators,
                description: h.metadata.description,
                journal: h.metadata.journal,
                keywords: h.metadata.keywords,
                publication_date: h.metadata.publication_date,
                related_identifiers: h.metadata.related_identifiers,
                title: h.metadata.title
            })
        });

        return {
            'num-of-records': total,
            from: from,
            to: to,
            prevpage: page >= 1 ? page - 1 : '',
            nextpage: num < limit ? '' : parseInt(page) + 1,
            'search-criteria': queryObject,
            records: records,
            statistics: statistics,
        };
        
    }
    catch(err) {
        console.error(err);
    }
};


const getStats = async function(query) {

    const statistics = {};

    const uri = Zenodo + query;

    try {
        debug('querying ' + uri);
        const {res, payload} =  await Wreck.get(uri);
        const data = await JSON.parse(payload);
        const byAccessRight = data.aggregations.access_right.buckets;
        const byKeywords = data.aggregations.keywords.buckets;
        byAccessRight.forEach(k => {
            statistics[k.key] = k.doc_count;
        });

        
        return statistics;
    }
    catch(err) {
        console.error(err);
        return {error: err}
    }
};

const queryMaker = function(request) {

    let hrefArray = [];
    for (let p in request.query) {
        if (p !== 'refreshCache') {
            hrefArray.push(p + '=' + request.query[p]);
        }
    }

    return hrefArray.sort().join('&');
}