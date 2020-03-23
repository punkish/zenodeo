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

        // Add names of the resource and the resource's PK
        // Note, these are *not* values, but just keys. For
        // example, 'treatments' and 'treatmentId', not 
        // '000343DSDHSK923HHC9SKKS' (value of 'treatmentId')
        queryObject.resource = plugins._resource;
        queryObject.resources = plugins._resources;
        queryObject.resourceId = plugins._resourceId;
        
        // bunch up messages to print them to the log
        const messages = [{label: 'queryObject', params: queryObject}];
    
        // cacheKey is the URL query without the refreshCache param.
        const cacheKey = Utils.makeCacheKey(request);
        messages.push({label: 'cacheKey', params: cacheKey});
    
        let result;
        if (cacheOn) {
            if (queryObject.refreshCache || queryObject.refreshCache === 'true') {
                messages.push({label: 'info', params: 'force emptying the cache'});
                this.cache.drop(cacheKey);
                messages.push({label: 'info', params: 'refilling the cache'});
            }
    
            messages.push({label: 'info', params: 'getting results from  the cache'});
            plog.log({ header: 'WEB QUERY', messages: messages });
            result = this.cache.get(cacheKey);
        }
        else {
            messages.push({label: 'info', params: 'querying for fresh results'});
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
    //plog.info('remote URI (one)', uriRemote);

    // data will hold all the query results to be sent back
    const data = { 'search-criteria': {} };

    // The following params may get added to the queryObject but they 
    // are not used when making the _self, _prev, _next links, or  
    // the search-criteria 
    const exclude = ['resources', 'limit', 'offset', 'refreshCache', 'resources', 'resourceId', 'page', 'size', 'sortBy', 'facets', 'stats'];

    for (let key in queryObject) {
        if (! exclude.includes(key)) {
            data['search-criteria'][key] = queryObject[key];
        }
    }

    try {
        const {res, payload} =  await Wreck.get(uriRemote);
        //data = await JSON.parse(payload) || { 'num-of-records': 0 };

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
    
    //data['search-criteria'] = queryObject;
    data._links = Utils.makeSelfLink({
        uri: uriZenodeo, 
        resource: queryObject.resources, 
        queryString: Object.entries(data['search-criteria'])
            .map(e => e[0] + '=' + e[1])
            .sort()
            .join('&')
    });

    messages.push({label: 'num-of-records', params: data['num-of-records']});
    plog.log({ header: 'ONE QUERY', messages: messages });

    return data;
};

const calcQ = function(queryObject) {
    const qArr = [];

    const seen = {
        creator: false,
        title: false
    };

    // this is where we store all the query params so we can 
    // create a query from them
    const params = [];

    for (let k in queryObject) {

        // 'resources' and 'refreshCache' are not sent to Zenodo
        if (k !== 'refreshCache' && k !== 'resources') {

            const param = queryObject[k];

            if (Array.isArray(param)) {

                // convert 'type' into 'subtype' and join all of them into the query like so
                // subtype=value1&subtype=value2&subtype=value3
                if (k === 'type') k = 'subtype';
                param.forEach(p => params.push(`${k}=${p}`));

            }
            else {
                if (k === 'type') {
                    if (param.toLowerCase() === 'all') {

                        const resources = ['publications', 'images'];
                        if (resources.includes(queryObject.resources)) {
                            let v = Schema.defaults[queryObject.resources];
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

                else if (k === 'creator') {

                    if (! seen.creator) {
                        let c = queryObject.creator;

                        if (c.indexOf(' AND ') > -1) {
                            c = `(${c})`;
                        }
                        else if (/".+"/.test(c)) {
                            c = c;
                        }
                        else {
                            c = `/${c}.*/`;
                        }
    
                        qArr.push('+creators.name:' + c);
    
                        // remove 'creator' from queryObject as its job is done
                        delete(queryObject.creator);
                        seen.creator = true;
                    }
                    
                }

                else if (k === 'title') {

                    if (! seen.title) {
                        let c = queryObject.title;

                        if (c.indexOf(' AND ') > -1) {
                            c = `(${c})`;
                        }
                        else if (/".+"/.test(c)) {
                            c = c;
                        }
                        else {
                            c = `/${c}.*/`;
                        }
    
                        qArr.push('+title:' + c);
    
                        // remove 'title' from queryObject as its job is done
                        delete(queryObject.title);
                        seen.title = true;
                    }
                    
                }

                else if (k === 'q') {

                    qArr.push(queryObject.q);

                    if (queryObject.creator) {
                        if (! seen.creator) {
                            let c = queryObject.creator;

                            if (c.indexOf(' AND ') > -1) {
                                c = `(${c})`;
                            }
                            else if (/".+"/.test(c)) {
                                c = c;
                            }
                            else {
                                c = `/${c}.*/`;
                            }
        
                            qArr.push('+creators.name:' + c);
        
                            // remove 'creator' from queryObject as its job is done
                            delete(queryObject.creator);
                            seen.creator = true;
                        }
                    }
                    else if (queryObject.title) {
                        if (! seen.title) {
                            let c = queryObject.title;

                            if (c.indexOf(' AND ') > -1) {
                                c = `(${c})`;
                            }
                            else if (/".+"/.test(c)) {
                                c = c;
                            }
                            else {
                                c = `/${c}.*/`;
                            }
        
                            qArr.push('+title:' + c);
        
                            // remove 'title' from queryObject as its job is done
                            delete(queryObject.title);
                            seen.title = true;
                        }
                    }
                    else {
                        params.push(`${k}=${param}`);
                    }
                }

                else {
                    params.push(`${k}=${param}`);
                }
            }
        }
    }

    let q = qArr.join(' ');
    plog.info('q', q);
    return [encodeURIComponent(q), params]
};

const getManyRecords = async function(queryObject) {

    // data will hold all the query results to be sent back
    const data = { 'search-criteria': {} };

    // The following params may get added to the queryObject but they 
    // are not used when making the _self, _prev, _next links, or  
    // the search-criteria 
    const exclude = ['refreshCache', 'resource', 'resources', 'resourceId'];

    for (let key in queryObject) {
        if (! exclude.includes(key)) {
            data['search-criteria'][key] = queryObject[key];
        }
    }

    // print out the queryObject
    const messages = [{label: 'queryObject', params: queryObject}];

    const [q, params] = calcQ(queryObject);
    const queryString = `q=${q}&${params.join('&')}&type=${queryObject.resource}&access_right=open`;
    plog.info('queryString', queryString);
    const uriRemote = `${uriZenodo}?${queryString}`;
    messages.push({ label: 'remote URI', params: uriRemote });

    let t = process.hrtime();
    try {
        const {res, payload} =  await Wreck.get(uriRemote);
        const result = await JSON.parse(payload);
        const hits = result.hits;

        data['num-of-records'] = hits.total;
        data.records = hits.hits;
    }
    catch(error) {
        plog.error(error);
    }

    messages.push({ label: 'count', params: data['num-of-records'] });

    // add a self link to the data
    data._links = {};
    data._links.self = Utils.makeSelfLink({
        uri: uriZenodeo, 
        resource: queryObject.resources, 
        queryString: Object.entries(data['search-criteria'])
            .map(e => e[0] + '=' + e[1])
            .sort()
            .join('&')
    });

    data._links.prev = Utils.makeLink({
        uri: uriZenodeo, 
        resource: queryObject.resources, 
        queryString: Object.entries(data['search-criteria'])
            .map(e => e[0] + '=' + (e[0] === 'page' ? data.prevpage : e[1]))
            .sort()
            .join('&')
    });

    data._links.next = Utils.makeLink({
        uri: uriZenodeo, 
        resource: queryObject.resources, 
        queryString: Object.entries(data['search-criteria'])
            .map(e => e[0] + '=' + (e[0] === 'page' ? data.nextpage : e[1]))
            .sort()
            .join('&')
    });

    const page = queryObject.page ? parseInt(queryObject.page) : 1;

    const limit = queryObject.size;
    const num = data.records.length;
    data.from = ((page - 1) * limit) + 1;
    data.to = num < limit ? parseInt(data.from) + parseInt(num) - 1 : parseInt(data.from) + parseInt(limit) - 1;

    plog.info(`found ${queryObject.resources}`, data['num-of-records']);
    plog.info(`retrieved ${queryObject.resources}`, num);

    data.prevpage = page >= 1 ? page - 1 : '';
    data.nextpage = num < limit ? '' : parseInt(page) + 1;

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

// const creator = function(c) {

//         // if the user wants to use boolean AND, we need to wrap the 
//         // search terms in parens

//         // AND
//         // creators.name:(Agosti AND Donat) 
//         //// creator = 'Agosti AND Donat';
//         if (c.indexOf(' AND ') > -1) {
//             queryArray.push(`+creators.name:(${c})`);
//         }
//         else {

//             // for all other cases

//             // starts with
//             // creators.name:/Agosti.*/
//             //// creator = /Agosti.*/;

//             // single token
//             // creators.name:Agosti
//             //// creator = 'Agosti';

//             // exact phrase
//             // creators.name:”Agosti, Donat”
//             //// creator = '"Agosti, Donat"';

//             // OR
//             // creators.name:(Agosti Donat)
//             //// creator = 'Agosti Donat';
//             queryArray.push(`+creators.name:${c}.*/`);
//         }

        
// }

module.exports = {handler, getRecords};