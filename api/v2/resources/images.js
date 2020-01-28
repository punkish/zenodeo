'use strict';

const Schema = require('../schema.js');
const ResponseMessages = require('../../responseMessages');
const Utils = require('../utils');

const plugins = {
    _resource: 'image',
    _resources: 'images',
    _name: 'images2',
    _segment: 'images2',
    _path: '/images',
    _order: 7
};

const {handler, getRecords} = require('../lib/z');

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

                handler: handler(plugins)
            }]);
        },
    },
};

// const handler = async function(request, h) {

//     plog.info('request.query', request.query);
    
//     // cacheKey is the URL query without the refreshCache param.
//     // The default params, if any, are used in making the cacheKey.
//     // The default params are also used in queryObject to actually 
//     // perform the query. However, the default params are not used 
//     // to determine what kind of query to perform.
//     const cacheKey = Utils.makeCacheKey(request);
//     plog.info('cacheKey', cacheKey);

//     if (cacheOn) {
//         if (request.query.refreshCache === 'true') {
//             plog.info('forcing refreshCache');
//             this.cache.drop(cacheKey);
//         }

//         return this.cache.get(cacheKey);
//     }
//     else {
//         return getRecords(cacheKey);
//     }
// };

// const getRecords = function(cacheKey) {
//     const queryObject = Utils.makeQueryObject(cacheKey);
//     plog.info('queryObject', queryObject);

//     // An id is present. The query is for a specific
//     // record. All other query params are ignored
//     if (queryObject.id) {
//         return getOneRecord(queryObject);
//     }
    
//     // More complicated queries with search parameters
//     else {
//         return getManyRecords(queryObject)
//     }
// };

// const getOneRecord = async function(queryObject) {    
//     let data;
//     const uriRemote = uriZenodo + queryObject.id;

//     try {
//         plog.info(`querying ${uriRemote}`);
//         const {res, payload} =  await Wreck.get(uriRemote);
//         data = await JSON.parse(payload) || { 'num-of-records': 0 };
//     }
//     catch(err) {
//         plog.error(err);
//     }
    
//     data['search-criteria'] = queryObject;
//     data._links = Utils.makeSelfLink({
//         uri: uriZenodeo, 
//         resource: 'images', 
//         queryString: Object.entries(queryObject)
//             .map(e => e[0] + '=' + e[1])
//             .sort()
//             .join('&')
//     });

//     return data;
// };

// const getManyRecords = async function(queryObject) {
//     const data = {
//         'search-criteria': JSON.parse(JSON.stringify(queryObject))
//     };

//     const mandatoryparams = ['page', 'size', 'communities', 'q'];

//     // default search
//     let searchType = 'simple';

//     for (let k in queryObject) {
//         if (!mandatoryparams.includes(k)) {
//             searchType = 'fancy';
//             break;
//         }
//     }

//     let queryString = '';

//     // if queryObject contains *only* q besides the mandatory params
//     // then it is a simple search
//     if (searchType === 'simple') {
//         const others = [];

//         for (let k in queryObject) {
//             if (k === 'communities') {
//                 queryObject['communities'].split(',').forEach(c => others.push(`communities=${c}`));
//             }
//             else {
//                 others.push(`${k}=${queryObject[k]}`);
//             }
//         }

//         const qs = others.join('&');
//         plog.info('queryString', qs);
//         //const queryString = `q=${encodeURIComponent(qs)}&${Object.keys(queryObject).map(e => e + '=' + queryObject[e]).join('&')}&communities=biosyslit&type=${plugins._resource}&access_right=open`;
//         queryString = `${qs}&type=${plugins._resource}&access_right=open`;
//     }

//     // if queryObject contains other search params besides q then 
//     // it is a fancysearch
//     else if (searchType === 'fancy') {

//         const exclude = ['page', 'size', 'type', 'communities'];
//         const zenodoSynonyms = {
//             author: 'creators.name',
//             text: 'q'
//         };

//         // the following params are searched for exact pattern
//         const exact = ['doi'];

//         const queryArray = [];
//         const others = [];

//         for (let k in queryObject) {
//             if (!exclude.includes(k)) {
//                 if (k === 'q') {
//                     queryArray.push(`+${queryObject.q}`);
//                 }
//                 else {

//                     if (k in zenodoSynonyms) {
//                         if (exact.includes(k)) {
//                             queryArray.push(`+${zenodoSynonyms[k]}:"${queryObject[k]}"`);
//                         }
//                         else {
//                             queryArray.push(`+${zenodoSynonyms[k]}:${queryObject[k]}`);
//                         }
                        
//                     }
//                     else {
//                         if (exact.includes(k)) {
//                             queryArray.push(`+${k}:"${queryObject[k]}"`);
//                         }
//                         else {
//                             queryArray.push(`+${k}:${queryObject[k]}`);
//                         }
//                     }
                    
//                 }

//                 delete(queryObject[k]);
//             }
//             else {
//                 others.push(`${k}=${queryObject[k]}`);
//             }
//         }
        
//         const qs = queryArray.join(' ');
//         //debug(`qs: ${qs}`);
//         //const queryString = `q=${encodeURIComponent(qs)}&${Object.keys(queryObject).map(e => e + '=' + queryObject[e]).join('&')}&communities=biosyslit&type=${plugins._resource}&access_right=open`;
//         queryString = `q=${encodeURIComponent(qs)}&type=${plugins._resource}&access_right=open&${others.join('&')}`;
        
//         plog.info('queryString', queryString);

//     }

//     const uriRemote = `${uriZenodo}?${queryString}`;
//     const limit = 30;

//     try {
//         plog.info(`querying ${uriRemote}`);
//         const {res, payload} =  await Wreck.get(uriRemote);
//         const result = await JSON.parse(payload);
//         const total = result.hits.total;
//         const hits = result.hits.hits;
//         const num = hits.length;

//         //const byAccessRight = result.aggregations.access_right.buckets;
//         const byKeywords = result.aggregations.keywords.buckets;
//         const statistics = {};
//         byKeywords.forEach(k => {
//             statistics[k.key] = k.doc_count;
//         });

//         const page = queryObject.page ? parseInt(queryObject.page) : 1;

//         //const offset = page * 30;

//         const from = ((page - 1) * 30) + 1;
//         const to = num < limit ? from + num - 1 : from + limit - 1;

//         const records = [];

//         plog.info(`found ${total} open records… now getting their ${plugins._resources}`);
//         plog.info(`number of images: ${hits.length}`);

//         hits.forEach(h => {
//             records.push({
//                 conceptrecid: h.conceptrecid,
//                 created: h.created,
//                 doi: h.doi,
//                 files: h.files.forEach(f => f.links.self),
//                 id: h.id,
//                 html: h.links.latest_html,
//                 thumbs: h.links.thumbs,
//                 creators: h.metadata.creators,
//                 description: h.metadata.description,
//                 journal: h.metadata.journal,
//                 keywords: h.metadata.keywords,
//                 publication_date: h.metadata.publication_date,
//                 related_identifiers: h.metadata.related_identifiers,
//                 title: h.metadata.title
//             })
//         });

//         data['num-of-records'] = total;
//         data.from = from;
//         data.to = to;
//         data.prevpage = page >= 1 ? page - 1 : '';
//         data.nextpage = num < limit ? '' : parseInt(page) + 1;
//         data.records = records;
//         data.statistics = statistics;

        
//         if ('facets' in queryObject && queryObject.facets === 'true') {
//             data.facets = {};
//         }

//         if ('stats' in queryObject && queryObject.stats === 'true') {
//             data.stats = {};

//             const byAccessRight = data.aggregations.access_right.buckets;
//             byAccessRight.forEach(k => {
//                 data.stats[k.key] = k.doc_count;
//             });

//             const byKeywords = data.aggregations.keywords.buckets;
//             byKeywords.forEach(k => {
//                 data.stats[k.key] = k.doc_count;
//             });
//         }

//         return data;
//     }
//     catch(err) {
//         plog.error(JSON.stringify(err));
//     }
// };


// const getStats = async function(query) {

//     const stats = {};

//     const uri = Zenodo + query;

//     try {
//         plog.info('querying ' + uri);
//         const {res, payload} =  await Wreck.get(uri);
//         const data = await JSON.parse(payload);
//         const byAccessRight = data.aggregations.access_right.buckets;
//         const byKeywords = data.aggregations.keywords.buckets;
//         byAccessRight.forEach(k => {
//             stats[k.key] = k.doc_count;
//         });

        
//         return stats;
//     }
//     catch(err) {
//         plog.error(err);
//     }
// };