'use strict';

const config = require('config');
const plog = require(config.get('plog'));
const Schema = require('../schema.js');
const ResponseMessages = require('../../responseMessages');
const Utils = require('../utils');
const Database = require('better-sqlite3');
const db = new Database(config.get('data.treatments'));

const uriZenodeo = config.get('uri.zenodeo') + '/v2';
const cacheOn = config.get('cache.v2.on');

const queryMaker = require('../lib/query-maker');

const plugins = {
    _resource: 'citation',
    _resources: 'citations',
    _resouceId: 'bibRefCitationId',
    _name: 'citation2',
    _segment: 'citation2',
    _path: '/citations',
    _order: 5
};

String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
        return typeof args[number] != 'undefined' ? args[number] : match;
    });
};

module.exports = {
    plugin: {
        name: plugins._name,
        register: function(server, options) {

            const cache = Utils.makeCache({
                server: server, 
                options: options, 
                query: getRecords,  
                segment: plugins._segment
            });

            // binds the cache to every route registered  
            // **within this plugin** after this line
            server.bind({ cache });

            server.route([{ 
                path: plugins._path,   
                method: 'GET', 
                config: {
                    description: `Fetch ${plugins._resources} from Zenodeo`,
                    tags: [plugins._resources, 'api'],
                    tags: [plugins._resource, 'api'],
                    plugins: {
                        'hapi-swagger': {
                            order: plugins._order,
                            responseMessages: ResponseMessages
                        }
                    },
                    validate: Schema[plugins._resources],
                    notes: [
                        `This is the main route for fetching ${plugins._resources} from Zenodeo matching the provided query parameters.`
                    ]
                },

                handler 
            }]);
        },
    },
};

const handler = function(request, h) {

    plog.info('request.query', request.query);

    // cacheKey is the URL query without the refreshCache param.
    // The default params, if any, are used in making the cacheKey.
    // The default params are also used in queryObject to actually 
    // perform the query. However, the default params are not used 
    // to determine what kind of query to perform.
    const cacheKey = Utils.makeCacheKey(request);
    plog.info('cacheKey', cacheKey);

    if (cacheOn) {
        if (request.query.refreshCache === 'true') {
            plog.info('forcing refreshCache');
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
    queryObject.resource = plugins._resources;
    plog.info('queryObject', queryObject);

    // A resourceId is present. The query is for a specific
    // record. All other query params are ignored
    if (queryObject[plugins._resourceId]) {
        return getOneRecord(queryObject);
    }
    
    // More complicated queries with search parameters
    else {
        return getManyRecords(queryObject);
    }
};

const getOneRecord = function(queryObject) {    

    let data;
    const queries = queryMaker(queryObject);

    try {
        plog.info('ONE seldata', queries.seldata);
        
        // if the query is unsuccessful, add 'num-of-records' = 0
        data = db.prepare(queries.seldata).get(queryObject) || { 'num-of-records': 0 };
    } 
    catch (error) {
        plog.log.error(error);
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

    plog.info('num-of-records', data['num-of-records']);

    // if 'num-of-records' is undefined, that means the query 
    // was successful and a match was found
    if (typeof data['num-of-records'] === 'undefined') {

        data['num-of-records'] = 1;
        data['related-records'] = getRelatedRecords(queries, queryObject);
    }

    return data;
};

const getManyRecords = function(queryObject) {
    
    const queries = queryMaker(queryObject);
    plog.info('MANY queryObject', queryObject);

    const data = {};

    // first find total number of matches
    try {
        plog.info('MANY selcount', queries.selcount);
        data['num-of-records'] = db.prepare(queries.selcount)
            .get(queryObject)
            .numOfRecords;
    }
    catch (error) {
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

    // We are done if no records found
    if (!data['num-of-records']) {
        return data;
    }

    // now, get the records
    const id = queryObject.id ? parseInt(queryObject.id) : 0;
    const page = queryObject.page ? parseInt(queryObject.page) : 1;
    const offset = (page - 1) * 30;
    const limit = 30;

    // get the records
    try {
        queryObject.limit = limit;
        queryObject.offset = offset;
        plog.info('MANY seldata', queries.seldata);
        data.records = db.prepare(queries.seldata).all(queryObject) || [];
    }
    catch (error) {
        plog.error(error);
    }

    if (data.records.length > 0) {
        data.records.forEach(rec => {
            rec._links = Utils.makeSelfLink({
                uri: uriZenodeo, 
                resource: plugins._resources, 
                queryString: Object.entries({bibRefCitationId: rec[plugins._resourceId]})
                    .map(e => e[0] + '=' + e[1])
                    .sort()
                    .join('&')
            });
        });

        const lastrec = data.records[data.records.length - 1];
        data.nextid = lastrec.id;
    }
    else {
        data.nextid = '';
    }

    // set some records-specific from and to for the formatted
    // search criteria string
    data.from = ((page - 1) * 30) + 1;
    data.to = data.records.length < limit ? 
        data.from + data.records.length - 1 : 
        data.from + limit - 1;

    data.previd = id;

    data.prevpage = page >= 1 ? page - 1 : '';
    data.nextpage = data.records.length < limit ? '' : parseInt(page) + 1;

    // finally, get facets and stats, if requested   
    if ('facets' in queryObject && queryObject.facets === 'true') {
        data.facets = getFacets(queries, queryObject);
    }

    if ('stats' in queryObject && queryObject.stats === 'true') {
        data.stats = getStats(queries, queryObject);
    }
    
    // all done
    return data;
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

const getRelatedRecords = function(queries, queryObject) {
    const rr = {};

    const relatedRecords = queries.selrelated;
    plog.info(queries);

    for (let relatedResource in relatedRecords) {


        try {
            const select = relatedRecords[relatedResource];
            plog.info(`ONE RELATED ${relatedResource}`, select);
            const data = db.prepare(select).all(queryObject);

            rr[relatedResource] = Utils.halify({
                records: data, 
                uri: uriZenodeo, 
                resource: relatedResource,
                id: `${relatedResource.substr(0, relatedResource.length - 1)}Id`
            })
        }
        catch(error) {
            plog.info(error);
        }
    }

    return rr;
};