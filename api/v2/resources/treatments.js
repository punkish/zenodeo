'use strict';

const config = require('config');
const plog = require(config.get('plog'));
const Schema = require('../schema.js');
const ResponseMessages = require('../../responseMessages');
const Utils = require('../utils');
const Database = require('better-sqlite3');
const db = new Database(config.get('data.treatments'));
const fs = require('fs');
//const treatmentStatus = require('../lib/treatmentsStatus');

const uriZenodeo = config.get('uri.zenodeo');
const cacheOn = config.get('v2.cache.on');

const queryMaker = require('../lib/query-maker');

const plugins = {
    _resource: 'treatment',
    _resources: 'treatments',
    _resourceId: 'treatmentId',
    _name: 'treatments2',
    _segment: 'treatments2',
    _path: '/treatments',
    _order: 2
};

String.prototype.format = function() {
    const args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
        return typeof args[number] != 'undefined' ? args[number] : match;
    });
};

module.exports = {
    plugin: {
        name: plugins._name,
        register: function(server, options) {

            // create the cache
            const cache = Utils.makeCache({
                server: server, 
                options: options, 
                query: getRecords,
                plugins: plugins
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

                handler: handler(plugins) 
            }]);
        },
    },
};

const handler = function(plugins) {

    return function(request, h) {

        const queryObject = request.query;
        queryObject.resources = plugins._resources;

        // bunch up messages to print them to the log
        const messages = [{label: 'queryObject', params: queryObject}];
    
        // if xml is being requested, send it back and be done with it
        if (queryObject.format && queryObject.format === 'xml') {
    
            return h.response(getXml(queryObject.treatmentId))
                .type('text/xml')
                .header('Content-Type', 'application/xml');
    
        }
    
        // cacheKey is the URL query without the refreshCache param.
        const cacheKey = Utils.makeCacheKey(request);
        messages.push({label: 'cacheKey', params: cacheKey});
    
        if (cacheOn) {
            if (queryObject.refreshCache) {
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

    // A resourceId is present. The query is for a specific
    // record. All other query params are ignored
    if (queryObject[plugins._resourceId]) {
        return getOneRecord(queryObject);
    }
    
    // More complicated queries with search parameters
    else {
        return getManyRecords(queryObject)
    }
};

const getOneRecord = function(queryObject) {    

    const queries = queryMaker(queryObject);
    const messages = [{label: 'queryObject', params: queryObject}];

    // data will hold all the query results to be sent back
    const data = {

        // deep clone the queryObject
        'search-criteria': JSON.parse(JSON.stringify(queryObject))
    };

    try {
        messages.push({label: 'seldata', params: queries.seldata});

        // if the query is successful,  but no records are found
        // add 'num-of-records' = 0
        data.records = [db.prepare(queries.seldata).get(queryObject)] || [];
        if (data.records) {
            data['num-of-records'] = 1;
        }
        else {
            data['num-of-records'] = 0;
        }
    } 
    catch (error) {
        plog.error(error);
    }
    
    // add a self link to the data
    data._links = Utils.makeSelfLink({
        uri: uriZenodeo, 
        resource: plugins._resources, 
        queryString: Object.entries(queryObject)
            .map(e => e[0] + '=' + e[1])
            .sort()
            .join('&')
    });

    messages.push({label: 'num-of-records', params: data['num-of-records']});
    plog.log({
        header: 'ONE QUERY',
        messages: messages
    });

    // We are done if no records found
    if (!data['num-of-records']) {
        return data;
    }

    // more data from beyond the database
    data.xml = getXml(queryObject.treatmentId);
    data.taxonStats = getTaxonStats(data);
    data['related-records'] = getRelatedRecords(queries, queryObject);

    return data;
};

const getManyRecords = function(queryObject) {

    const queries = queryMaker(queryObject);
    const messages = [{label: 'queryObject', params: queryObject}];
    
    // data will hold all the query results to be sent back
    const data = {

        // deep clone the queryObject
        'search-criteria': JSON.parse(JSON.stringify(queryObject))
    };

    // first find total number of matches
    try {
        messages.push({label: 'selcount', params: queries.selcount});
        data['num-of-records'] = db.prepare(queries.selcount)
            .get(queryObject)
            .numOfRecords;
    }
    catch (error) {
        plog.error(JSON.stringify(error));
    }
    
    // add a self link to the data
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
    const offset = (page - 1) * Schema.defaults.size;
    const limit = 30;

    // get the records
    try {
        queryObject.limit = limit;
        queryObject.offset = offset;
        messages.push({label: 'seldata', params: queries.seldata});
        data.records = db.prepare(queries.seldata).all(queryObject) || [];
    }
    catch (error) {
        plog.error(error);
    }

    plog.log({
        header: 'MANY QUERIES',
        messages: messages
    });

    if (data.records.length > 0) {
        data.records.forEach(rec => {
            rec._links = Utils.makeSelfLink({
                uri: uriZenodeo, 
                resource: plugins._resources, 
                queryString: Object.entries({treatmentId: rec[plugins._resourceId]})
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
    const messages = [];

    if (queries.selfacets) {
        for (let q in queries.selfacets) {
            try {
                //plog.info(`MANY FACETS ${q}`, queries.selfacets[q]);
                messages.push({label: q, params: queries.selfacets[q]});
                facets[q] = db.prepare(queries.selfacets[q]).all(queryObject);
            }
            catch (error) {
                plog.error(error);
            }
        }
    }

    plog.log({
        header: 'MANY FACETS',
        messages: messages
    });

    return facets;
}

const getStats = function(queries, queryObject) {

    const stats = {};
    const messages = [];

    if (queries.selstats) {
        for (let q in queries.selstats) {
            try {
                //plog.info(`MANY STATS ${q}`, queries.selstats[q]);
                messages.push({label: q, params: queries.selstats[q]});
                stats[q] = db.prepare(queries.selstats[q]).all(queryObject);
            }
            catch (error) {
                plog.error(error);
            }
        }
    }

    plog.log({
        header: 'MANY STATS',
        messages: messages
    });

    return stats;
};

const getRelatedRecords = function(queries, queryObject) {

    const rr = {};
    const relatedRecords = queries.selrelated;
    const messages = [];

    for (let relatedResource in relatedRecords) {

        try {
            const select = relatedRecords[relatedResource];
            messages.push({label: relatedResource, params: select});

            const data = db.prepare(select).all(queryObject);

            rr[relatedResource] = Utils.halify({
                records: data, 
                uri: uriZenodeo, 
                resource: relatedResource,
                id: `${relatedResource.substr(0, relatedResource.length - 1)}Id`
            });
        }
        catch(error) {
            plog.info(error);
        }

        
    }

    plog.log({
        header: 'ONE RELATED',
        messages: messages
    });

    return rr;
};

const getTaxonStats = function(data) {
    const rec = data.records[0];
    const taxonStats = [
        { name: 'kingdom', value: rec.kingdom, num: 0 }, 
        { name: 'phylum',  value: rec.phylum,  num: 0 }, 
        { name: '"order"', value: rec.order,   num: 0 }, 
        { name: 'family',  value: rec.family,  num: 0 }, 
        { name: 'genus',   value: rec.genus,   num: 0 }, 
        { name: 'species', value: rec.species, num: 0 }
    ];

    const messages = [];

    taxonStats.forEach((taxon, index) => {
        const select = `SELECT Count(treatmentId) AS num FROM treatments WHERE deleted = 0 AND ${taxon.name} = '${taxon.value}'`;
        messages.push({label: taxon.name, params: select});
        try {
            taxonStats[index].num = db.prepare(select).get().num;
        } 
        catch (error) {
            plog.error(error);
        }
    })

    plog.log({
        header: 'ONE TAXONSTATS',
        messages: messages
    });

    return taxonStats;
};

const getXml = function(treatmentId) {
    const one = treatmentId.substr(0, 1);
    const two = treatmentId.substr(0, 2);
    const thr = treatmentId.substr(0, 3);

    plog.info(`getting the xml for ${treatmentId}`);

    return fs.readFileSync(
        `data/treatments/${one}/${two}/${thr}/${treatmentId}.xml`,
        'utf8'
    )
};

const formatAuthors = function(authors) {
    let authorsArr = authors.map(a => { return a.author });
    const numOfAuthors = authorsArr.length;

    let authorsList = '';
    if (numOfAuthors === 1) {
        authorsList = authorsArr[0];
    }
    else if (numOfAuthors === 2) {
        authorsList = authorsArr.join(' and ');
    }
    else if (numOfAuthors > 2) {
        authorsList = authorsArr.slice(0, 2).join(', ');
        authorsList += ' and ' + authorsArr[numOfAuthors - 1]
    }

    return authorsList;
};