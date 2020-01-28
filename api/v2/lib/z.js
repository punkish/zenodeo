'use strict';

const config = require('config');
const plog = require(config.get('plog'));

const uriZenodeo = config.get('uri.zenodeo') + '/v2';
const cacheOn = config.get('cache.v2.on');

const Wreck = require('@hapi/wreck');
const uriZenodo = config.get('uri.remote') + '/records/';

const Utils = require('../utils');

const handler = function(plugins) {

    const handler2 = async function(request, h) {

        plog.info('request.query', request.query);
    
        // cacheKey is the URL query without the refreshCache param.
        // The default params, if any, are used in making the cacheKey.
        // The default params are also used in queryObject to actually 
        // perform the query. However, the default params are not used 
        // to determine what kind of query to perform.
        const cacheKey = Utils.makeCacheKey(request);
        plog.info('cacheKey', cacheKey);
        plog.info('plugins', plugins);
    
        if (cacheOn) {
            if (request.query.refreshCache === 'true') {
                plog.info('forcing refreshCache');
                this.cache.drop(cacheKey);
            }
    
            return this.cache.get({cacheKey, plugins});
        }
        else {
            return getRecords({cacheKey, plugins});
        }
        
    };

    return handler2;
};



const getRecords = function({cacheKey, plugins}) {

    const queryObject = Utils.makeQueryObject(cacheKey);
    plog.info('queryObject', queryObject);

    // An id is present. The query is for a specific
    // record. All other query params are ignored
    if (queryObject.id) {
        return getOneRecord({queryObject, plugins});
    }
    
    // More complicated queries with search parameters
    else {
        return getManyRecords({queryObject, plugins})
    }
};

const getOneRecord = async function({queryObject, plugins}) {    
    let data;
    const uriRemote = uriZenodo + queryObject.id;

    try {
        plog.info(`querying ${uriRemote}`);
        const {res, payload} =  await Wreck.get(uriRemote);
        data = await JSON.parse(payload) || { 'num-of-records': 0 };
    }
    catch(err) {
        plog.error(err);
    }
    
    data['search-criteria'] = queryObject;
    data._links = Utils.makeSelfLink({
        uri: uriZenodeo, 
        resource: plugins._resources, 
        queryString: Object.entries(queryObject)
            .map(e => e[0] + '=' + e[1])
            .sort()
            .join('&')
    });

    return data;
};

const getManyRecords = async function({queryObject, plugins}) {

    // data will hold all the query results to be sent back
    const data = {

        // deep clone the queryObject
        'search-criteria': JSON.parse(JSON.stringify(queryObject))
    };


    // first we determine whether the searchtype is 'simple' or 'fancy'
    // as the way the query is constructed is different for the two
    const basicParams = ['page', 'size', 'communities', 'q', 'type'];

    // default search
    let searchType = 'simple';

    for (let k in queryObject) {

        // if there are any query params other than the basic params
        // then the searchtype is 'fancy' 
        if (basicParams.includes(k) == false) {
            searchType = 'fancy';
            break;
        }

    }

    plog.info(`searchtype: ${searchType}`);

    let queryString = '';

    if (searchType === 'simple') {
        
        const otherParams = [];

        for (let k in queryObject) {

            if (k === 'communities') {
                queryObject['communities']
                    .split(',')
                    .forEach(community => otherParams.push(
                        `communities=${community}`
                    ));
            }
            else if (k === 'type' && plugins._resource === 'publication') {
                otherParams.push(`subtype=${queryObject[k]}`);
            }
            else {
                otherParams.push(`${k}=${queryObject[k]}`);
            }

        }

        queryString = `${otherParams.join('&')}&type=${plugins._resource}&access_right=open`;
        plog.info('queryString', queryString);
    }

    // if queryObject contains other search params besides q then 
    // it is a fancysearch
    else if (searchType === 'fancy') {
        plog.info(`searchtype: fancy`);

        const exclude = ['page', 'size', 'type', 'communities'];
        const zenodoSynonyms = {
            author: 'creators.name',
            text: 'q'
        };

        // the following params are searched for exact pattern
        const exact = ['doi'];

        const queryArray = [];
        const others = [];

        for (let k in queryObject) {
            if (!exclude.includes(k)) {
                if (k === 'q') {
                    queryArray.push(`+${queryObject.q}`);
                }
                else {

                    if (k in zenodoSynonyms) {
                        if (exact.includes(k)) {
                            queryArray.push(`+${zenodoSynonyms[k]}:"${queryObject[k]}"`);
                        }
                        else {
                            queryArray.push(`+${zenodoSynonyms[k]}:${queryObject[k]}`);
                        }
                        
                    }
                    else {
                        if (exact.includes(k)) {
                            queryArray.push(`+${k}:"${queryObject[k]}"`);
                        }
                        else {
                            queryArray.push(`+${k}:${queryObject[k]}`);
                        }
                    }
                    
                }

                delete(queryObject[k]);
            }
            else {
                others.push(`${k}=${queryObject[k]}`);
            }
        }
        
        const qs = queryArray.join(' ');
        //debug(`qs: ${qs}`);
        //const queryString = `q=${encodeURIComponent(qs)}&${Object.keys(queryObject).map(e => e + '=' + queryObject[e]).join('&')}&communities=biosyslit&type=${plugins._resource}&access_right=open`;
        queryString = `q=${encodeURIComponent(qs)}&type=${plugins._resource}&access_right=open&${others.join('&')}`;
        
        plog.info('queryString', queryString);

    }

    const uriRemote = `${uriZenodo}?${queryString}`;
    const limit = 30;

    try {
        plog.info(`querying ${uriRemote}`);
        const {res, payload} =  await Wreck.get(uriRemote);
        const result = await JSON.parse(payload);
        const total = result.hits.total;
        const hits = result.hits.hits;
        const num = hits.length;

        const page = queryObject.page ? parseInt(queryObject.page) : 1;

        //const offset = page * 30;

        const from = ((page - 1) * 30) + 1;
        const to = num < limit ? from + num - 1 : from + limit - 1;

        //const records = [];

        plog.info(`found ${total} records… now getting their ${plugins._resources}`);
        plog.info(`number of ${plugins._resources}: ${hits.length}`);

        data['num-of-records'] = total;
        data.from = from;
        data.to = to;
        data.prevpage = page >= 1 ? page - 1 : '';
        data.nextpage = num < limit ? '' : parseInt(page) + 1;
        data.records = hits;

        return data;
    }
    catch(err) {
        plog.error(JSON.stringify(err));
    }
};

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

module.exports = {handler, getRecords};