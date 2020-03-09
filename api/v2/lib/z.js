/**************************************
 * abstracted logic for the handler and other functions 
 * for resources that are fetched from Zenodo
 * - images.js
 * - publications.js
 **************************************/

'use strict';

const config = require('config');
const plog = require(config.get('plog'));

const Schema = require('../schema.js');

const uriZenodeo = config.get('v2.uri.zenodeo');
const cacheOn = config.get('v2.cache.on');

const Wreck = require('@hapi/wreck');
const uriZenodo = config.get('v2.uri.zenodo') + '/records/';

const Utils = require('../utils');

const handler = function(plugins) {

    return async function(request, h) {

        const queryObject = request.query;
        queryObject.resources = plugins._resources;
        
        // bunch up messages to print them to the log
        const messages = [{label: 'queryObject', params: queryObject}];
    
        // cacheKey is the URL query without the refreshCache param.
        const cacheKey = Utils.makeCacheKey(request);
        messages.push({label: 'cacheKey', params: cacheKey});
    
        if (cacheOn) {
            if (queryObject.refreshCache === 'true') {
                messages.push({label: 'info', params: 'forcing refreshCache'});
                this.cache.drop(cacheKey);
            }
    
            messages.push({label: 'info', params: 'returning results from cache'});
            plog.log({
                header: 'WEB QUERY',
                messages: messages
            });

            return this.cache.get(cacheKey);
        }
        else {

            messages.push({label: 'info', params: 'querying for results'});
            plog.log({
                header: 'WEB QUERY',
                messages: messages
            });

            return getRecords({cacheKey, plugins});
        }
        
    };

};

const getRecords = function({cacheKey, plugins}) {

    const queryObject = Utils.makeQueryObject(cacheKey);

    // An id is present. The query is for a specific
    // record. All other query params are ignored
    if (queryObject[plugins._resourceId]) {
        return getOneRecord({queryObject, plugins});
    }
    
    // More complicated queries with search parameters
    else {
        return getManyRecords({queryObject, plugins})
    }
};

const getOneRecord = async function({queryObject, plugins}) {

    //const messages = [{label: 'queryObject', params: queryObject}];

    let data;
    const uriRemote = uriZenodo + queryObject[plugins._resourceId];
    plog.info('remote URI (one)', uriRemote);

    try {
        const {res, payload} =  await Wreck.get(uriRemote);
        data = await JSON.parse(payload) || { 'num-of-records': 0 };
    }
    catch(error) {
        plog.error(error);
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

    let queryString = '';

    const params = [];
    for (let k in queryObject) {
        if (k !== 'refreshCache' && k !== 'resources') {
            const param = queryObject[k];
            if (Array.isArray(param)) {
                if (k === 'type') k = 'subtype';
                param.forEach(p => params.push(`${k}=${p}`));
            }
            else {
                if (k === 'type') {
                    if (param.toLowerCase() === 'all') {
                        const resources = ['publications', 'images'];
                        if (resources.includes(plugins._resources)) {
                            let v = Schema.defaults[plugins._resources];
                            v = v.filter(i => i !== 'all');
                            v.forEach(t => params.push(`subtype=${t}`));
                        }
                    }
                    else {
                        params.push(`subtype=${param}`);
                    }
                }
                else if (k === 'communities') {
                    if (param.toLowerCase() === 'all') {
                        let v = Schema.defaults.communities;
                        v = v.filter(i => i !== 'all');
                        v.forEach(t => params.push(`communities=${t}`));
                    }
                    else {
                        params.push(`communities=${param}`);
                    }
                }
                else {
                    params.push(`${k}=${param}`);
                }
            }
        }
    }

    queryString = `${params.join('&')}&type=${plugins._resource}&access_right=open`;
    plog.info('queryString', queryString);
    const uriRemote = `${uriZenodo}?${queryString}`;
    const limit = queryObject.size;

    try {
        plog.info('remote URI (many)', uriRemote);
        const {res, payload} =  await Wreck.get(uriRemote);
        const result = await JSON.parse(payload);
        const hits = result.hits;

        data['num-of-records'] = hits.total;
        data.records = hits.hits;
        const num = hits.length;

        const page = queryObject.page ? parseInt(queryObject.page) : 1;

        data.from = ((page - 1) * limit) + 1;
        data.to = num < limit ? parseInt(data.from) + parseInt(num) - 1 : parseInt(data.from) + parseInt(limit) - 1;

        plog.info(`found ${plugins._resources}`, data['num-of-records']);
        plog.info(`retrieved ${plugins._resources}`, num);

        data.prevpage = page >= 1 ? page - 1 : '';
        data.nextpage = num < limit ? '' : parseInt(page) + 1;

    }
    catch(error) {
        plog.error(JSON.stringify(error));
    }

    data._links = Utils.makeSelfLink({
        uri: uriZenodeo, 
        resource: plugins._resources, 
        queryString: Object.entries(queryObject)
            .map(e => e[0] + '=' + e[1])
            .sort()
            .join('&')
    });

    // finally, get facets and stats, if requested   
    if ('facets' in queryObject && queryObject.facets === 'true') {
        //data.facets = getFacets();
        data.facets = {};
    }

    if ('stats' in queryObject && queryObject.stats === 'true') {
        //data.stats = getStats();
        data.stats = {};
    }

    // all done
    return data;
};

const getStats = function(queries, queryObject) {

    const stats = {};

    if (queries.selstats) {
        for (let q in queries.selstats) {
            try {
                plog.info(`MANY STATS ${q}`, queries.selstats[q]);
                stats[q] = db.prepare(queries.selstats[q]).all(queryObject);
            }
            catch (error) {
                plog.error(error);
            }
        }
    }

    return stats;
};

const getFacets = function(queries, queryObject) {

    const facets = {};

    if (queries.selfacets) {
        for (let q in queries.selfacets) {
            try {
                plog.info(`MANY FACETS ${q}`, queries.selfacets[q]);
                data.facets[q] = db.prepare(queries.selfacets[q]).all(queryObject);
            }
            catch (error) {
                plog.error(error);
            }
        }
    }

    return facets;
}

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