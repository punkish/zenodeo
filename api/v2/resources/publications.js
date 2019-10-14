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

const plugins = {
    _resource: 'publication',
    _resources: 'publications',
    _name: 'publications2',
    _segment: 'publications2',
    _path: '/publications',
    _order: 8
};

module.exports = {
    plugin: {
        name: plugins._name,
        register: async function(server, options) {

            const cache = Utils.makeCache({
                server: server, 
                options: options, 
                query: getRecords,  
                segment: plugins._segment
            });

            // binds cache to every route registered  
            // **within this plugin** after this line
            server.bind({ cache });

            server.route([{ 
                path: plugins._path, 
                method: 'GET', 
                config: {
                    description: `Fetch ${plugins._resources} from Zenodo`,
                    tags: [plugins._resources, 'api'],
                    plugins: {
                        'hapi-swagger': {
                            order: plugins._order,
                            responseMessages: ResponseMessages
                        }
                    },
                    validate: Schema[plugins._resources],
                    notes: [
                        `This is the main route for fetching ${plugins._resources} matching the provided query parameters.`
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
    const exclude = ['page', 'size', 'type'];
    const zenodoSynonyms = {
        title: 'title',
        creator: 'creators.name'
    };

    const queryArray = [];
    for (let k in queryObject) {
        if (!exclude.includes(k)) {
            if (k === 'q') {
                queryArray.push(`+${queryObject.q}`);
            }
            else {
                if (queryObject[k].indexOf(' AND ') > -1) {
                    queryArray.push(`+${zenodoSynonyms[k]}:(${queryObject[k]})`);
                }
                else {
                    queryArray.push(`+${zenodoSynonyms[k]}:${queryObject[k]}`);
                }
            }

            delete(queryObject[k]);
        }
    }
    
    const qs = queryArray.join(' ');
    debug(`qs: ${qs}`);
    const queryString = `q=${encodeURIComponent(qs)}&${Object.keys(queryObject).map(e => e + '=' + queryObject[e]).join('&')}&communities=biosyslit&type=${plugins._resource}&&access_right=open`;

    const uriRemote = `${uriZenodo}?${queryString}`;
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

        debug(`found ${total} open records… now getting their ${plugins._resources}`);
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