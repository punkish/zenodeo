/**************************************
 * abstracted logic for the handler and other functions 
 * for resources that are fetched from Zenodo
 * - images.js
 * - publications.js
 **************************************/

'use strict';

const config = require('config');
const plog = require(config.get('plog'));
const cacheOn = config.get('v2.cache.on');
const uriZenodeo = config.get('v2.uri.zenodeo');
const uriZenodo = config.get('v2.uri.zenodo') + '/records/';
const Utils = require('../utils');
const Wreck = require('@hapi/wreck');

const handler = function(resource) {

    return async function(request, h) {

        const queryObject = Utils.modifyIncomingQueryObject(request.query, resource);
        
        // bunch up messages to print them to the log
        const messages = [{label: 'queryObject', params: queryObject}];
    
        // cacheKey is the URL query without the refreshCache param.
        const cacheKey = Utils.makeCacheKey(request);
        messages.push({label: 'cacheKey', params: cacheKey});
    
        let result;
        if (cacheOn) {
            if (queryObject.refreshCache || queryObject.refreshCache === 'true') {

                messages.push({
                    label: 'info', 
                    params: 'force emptying the cache'
                });

                this.cache.drop(cacheKey);

                messages.push({
                    label: 'info', 
                    params: 'refilling the cache with fresh results'
                });

            }
    
            messages.push({
                label: 'info', 
                params: 'getting results from the cache'
            });

            plog.log({ header: 'WEB QUERY', messages: messages });
            result = this.cache.get(cacheKey);
        }
        else {
            
            messages.push({
                label: 'info', 
                params: 'querying for fresh results'
            });
            
            plog.log({ header: 'WEB QUERY', messages: messages });
            result = getRecords(cacheKey);

        }
        
        return result;

    };

};

const getRecords = function(cacheKey) {

    const queryObject = Utils.makeQueryObject(cacheKey);

    // An id is present. The query is for a specific
    // record. All other query params are ignored
    if (queryObject[queryObject.resourceId]) {
        return getOneRecord(queryObject);
    }
    
    // More complicated queries with search parameters
    else {
        return getManyRecords(queryObject)
    }
};

const getOneRecord = async function(queryObject) {

    const uriRemote = uriZenodo + queryObject[queryObject.resourceId];

    const messages = [ {label: 'queryObject', params: queryObject} ];
    messages.push({label: 'remote URI', params: uriRemote});

    // data will hold all the query results to be sent back
    const data = {
        'search-criteria': Utils.makeSearchCriteria(queryObject)
    };

    try {
        const {res, payload} =  await Wreck.get(uriRemote);

        // add query results to data.records. If no results are found,
        // add an empty array to data.records
        data.records = await JSON.parse(payload) || [];
    }
    catch(error) {
        plog.error(error);
    }

    // if the query is successful, but no records are found
    // add 'num-of-records' = 0
    data['num-of-records'] = data.records ? 1 : 0;

    data._links = {};
    data._links.self = Utils.makeLink({
        uri: uriZenodeo, 
        params: data['search-criteria'],
        type: 'self'
    });

    messages.push({label: 'num-of-records', params: data['num-of-records']});
    plog.log({ header: 'ONE QUERY', messages: messages });

    return data;
};

const getManyRecords = async function(queryObject) {

    let t = process.hrtime();

    const messages = [{label: 'queryObject', params: queryObject}];

    /// data will hold all the query results to be sent back
    const data = {
        'search-criteria': Utils.makeSearchCriteria(queryObject)
    };

    // calc limit and offset and add them to the queryObject
    // as we will need them for the query
    // const page = queryObject.page ? parseInt(queryObject.page) : 1;
    // const size = queryObject.size ? parseInt(queryObject.size) : 30;
    // const limit = size;
    // const offset = (page - 1) * limit;
    // queryObject.limit = limit;
    // queryObject.offset = offset;

    const queryString = Utils.makeRemoteQueryString(queryObject);
    //const queryString = `q=${q}&type=${queryObject.resource.slice(0, -1)}&access_right=open`;
    const uriRemote = `${uriZenodo}?${queryString}`;
    messages.push({ label: 'remote URI', params: uriRemote });

    let records;
    try {
        const {res, payload} =  await Wreck.get(uriRemote);
        const result = await JSON.parse(payload);
        const hits = result.hits;

        data['num-of-records'] = hits.total;
        messages.push({ label: 'count', params: data['num-of-records'] });
        records = hits.hits;
    }
    catch(error) {
        plog.error(error);
    }

    // add a self link to the data
    data._links = {};
    data._links.self = Utils.makeLink({
        uri: uriZenodeo, 
        params: data['search-criteria']
    });

    // We are done if no records found
    if (! data['num-of-records']) {
        plog.log({ 
            header: 'MANY QUERIES', 
            messages: messages, 
            queryObject: queryObject 
        });

        //return dataForDelivery(timer, data, debug);
        return data;
    }

    // store the records
    data.records = records;

    plog.log({ 
        header: 'MANY QUERIES', 
        messages: messages,
        queryObject: queryObject
    });

    // set some records-specific from and to for the formatted
    // search criteria string
    const num = data.records.length;
    data.from = ((queryObject.page - 1) * queryObject.size) + 1;
    data.to = num < queryObject.size ? 
        data.from + num - 1 : 
        data.from + queryObject.size - 1;


    data.prevpage = queryObject.page >= 1 ? queryObject.page - 1 : '';
    data.nextpage = num < queryObject.size ? '' : +queryObject.page + 1;

    data._links.prev = Utils.makeLink({
        uri: uriZenodeo, 
        params: data['search-criteria'],
        page: data.prevpage
    });

    data._links.next = Utils.makeLink({
        uri: uriZenodeo, 
        params: data['search-criteria'],
        page: data.nextpage
    });

    // finally, get facets and stats, if requested   
    if ('facets' in queryObject && queryObject.facets === 'true') {
        data.facets = getFacets(queryObject);
    }

    if ('stats' in queryObject && queryObject.stats === 'true') {
        data.stats = getStats(queryObject);
    }

    // all done
    const [s, ns] = process.hrtime(t);
    const ms = (ns / 1000000) + (s ? s * 1000 : 0);
    
    if (cacheOn) {
        return data;
    }
    else {
        return {
            value: data,
            cached: null,
            report: {
                msec: ms
            }
        }
    }
};

const getStats = function(queries, queryObject) {

    const stats = {};

    // if (queries.selstats) {
    //     for (let q in queries.selstats) {
    //         try {
    //             plog.info(`MANY STATS ${q}`, queries.selstats[q]);
    //             stats[q] = db.prepare(queries.selstats[q]).all(queryObject);
    //         }
    //         catch (error) {
    //             plog.error(error);
    //         }
    //     }
    // }

    return stats;
};

const getFacets = function(queries, queryObject) {

    const facets = {};

    // if (queries.selfacets) {
    //     for (let q in queries.selfacets) {
    //         try {
    //             plog.info(`MANY FACETS ${q}`, queries.selfacets[q]);
    //             data.facets[q] = db.prepare(queries.selfacets[q]).all(queryObject);
    //         }
    //         catch (error) {
    //             plog.error(error);
    //         }
    //     }
    // }

    return facets;
}

module.exports = { handler, getRecords };