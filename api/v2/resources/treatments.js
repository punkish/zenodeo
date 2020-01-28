'use strict';

const Schema = require('../schema.js');
const ResponseMessages = require('../../responseMessages');
const debug = require('debug')('v2:treatments');
const config = require('config');
const Utils = require('../utils');

const uriZenodeo = config.get('uri.zenodeo') + '/v2';
const cacheOn = config.get('cache.v2.on');

const Database = require('better-sqlite3');
const db = new Database(config.get('data.treatments'));
const fs = require('fs');
const treatmentStatus = require('../lib/treatmentsStatus');

const queryMaker = require('../lib/query-maker');

String.prototype.format = function() {
    const args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
        return typeof args[number] != 'undefined' ? args[number] : match;
    });
};

module.exports = {
    plugin: {
        name: 'treatments2',
        register: function(server, options) {

            const cache = Utils.makeCache({
                server: server, 
                options: options, 
                query: getRecords,  
                segment: 'treatments2'
            });

            // binds the cache to every route registered  
            // **within this plugin** after this line
            server.bind({ cache });

            server.route([{ 
                path: '/treatments', 
                method: 'GET', 
                config: {
                    description: "Retrieve treatments",
                    tags: ['treatments', 'api'],
                    plugins: {
                        'hapi-swagger': {
                            order: 2,
                            responseMessages: ResponseMessages
                        }
                    },
                    validate: Schema.treatments,
                    notes: [
                        'This is the main route for retrieving taxonomic treatments from the database.',
                    ]
                },
                handler 
            }]);
        },
    },
};

const handler = function(request, h) {

    // if xml is being requested, send it back and be done with it
    if (request.query.format && request.query.format === 'xml') {
        const xml = getXml(request.query.treatmentId);
        return h.response(xml)
            .type('text/xml')
            .header('Content-Type', 'application/xml');
    }

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

    // A treatmentId is present. The query is for a specific
    // treatment. All other query params are ignored
    if (queryObject.treatmentId) {
        return getOneRecord(queryObject);
    }
    
    // More complicated queries with search parameters
    else {
        return getManyRecords(queryObject)
    }
};

const getOneRecord = function(queryObject) {    

    let data;

    const queries = queryMaker(queryObject);
    debug(`ONE queryObject: ${JSON.stringify(queryObject)}`);

    try {
        debug(`ONE seldata: ${queries.seldata}`);
        data = db.prepare(queries.seldata).get(queryObject) || { 'num-of-records': 0 };
    } 
    catch (error) {
        console.log(error);
    }
    
    data['search-criteria'] = queryObject;
    data._links = Utils.makeSelfLink({
        uri: uriZenodeo, 
        resource: 'treatments', 
        queryString: Object.entries(queryObject)
            .map(e => e[0] + '=' + e[1])
            .sort()
            .join('&')
    });

    debug(`num-of-records: ${data['num-of-records']}`)
    if (typeof data['num-of-records'] === 'undefined') {

        // more data from beyond the database
        data.xml = getXml(queryObject.treatmentId);
        data.taxonStats = getTaxonStats(data);
        data['related-records'] = getRelatedRecords(queries, queryObject);
    }

    return data;
};

const getManyRecords = function(queryObject) {

    const queries = queryMaker(queryObject);
    debug(`MANY queryObject: ${JSON.stringify(queryObject)}`);
    //debug(`MANY queries: ${JSON.stringify(queries)}`);

    const data = {};

    // first find total number of matches
    try {
        debug(`MANY selcount: ${queries.selcount}`);
        data['num-of-records'] = db.prepare(queries.selcount)
            .get(queryObject)
            .numOfRecords;
    }
    catch (error) {
        console.log(error);
    }
    
    data['search-criteria'] = queryObject;
    data._links = Utils.makeSelfLink({
        uri: uriZenodeo, 
        resource: 'treatments', 
        queryString: Object.entries(queryObject)
            .map(e => e[0] + '=' + e[1])
            .sort()
            .join('&')
    });

    // We are done if no records found
    if (!data['num-of-records']) {
        return data;
    }

    // records are found, so we continue with the actual data selection

    // first, do the facet queries
    

    if ('facets' in queryObject && queryObject.facets === 'true') {
        data.facets = {};
        
        if (queries.selfacets) {
            for (let q in queries.selfacets) {
                try {
                    debug(`MANY FACETS ${q}: ${queries.selfacets[q]}`);
                    data.facets[q] = db.prepare(queries.selfacets[q]).all(queryObject);
                }
                catch (error) {
                    console.log(error);
                }
            }
        }
    }

    

    if ('stats' in queryObject && queryObject.stats === 'true') {
        data.stats = {};

        if (queries.selstats) {
            for (let q in queries.selstats) {
                try {
                    debug(`MANY STATS ${q}: ${queries.selstats[q]}`);
                    data.stats[q] = db.prepare(queries.selstats[q]).all(queryObject);
                }
                catch (error) {
                    console.log(error);
                }
            }
        }
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
        debug(`MANY seldata: ${queries.seldata}`);
        data.records = db.prepare(queries.seldata).all(queryObject) || [];
    }
    catch (error) {
        console.log(error);
    }

    if (data.records.length > 0) {
        data.records.forEach(rec => {
            rec._links = Utils.makeSelfLink({
                uri: uriZenodeo, 
                resource: 'treatments', 
                queryString: Object.entries({treatmentId: rec.treatmentId})
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
    
    return data;
    
};

const getRelatedRecords = function(queries, queryObject) {
    const rr = {};

    const relatedRecords = queries.selrelated;
    debug(queries);

    for (let relatedResource in relatedRecords) {


        try {
            const select = relatedRecords[relatedResource];
            debug(`ONE RELATED ${relatedResource}: ${select}`);
            const data = db.prepare(select).all(queryObject);

            rr[relatedResource] = Utils.halify({
                records: data, 
                uri: uriZenodeo, 
                resource: relatedResource,
                id: `${relatedResource.substr(0, relatedResource.length - 1)}Id`
            })
        }
        catch(error) {
            console.log(error);
        }
    }

    return rr;
};

const getTaxonStats = function(data) {
    const taxonStats = [
        { name: 'kingdom', value: data.kingdom, num: 0 }, 
        { name: 'phylum',  value: data.phylum,  num: 0 }, 
        { name: '"order"', value: data.order,   num: 0 }, 
        { name: 'family',  value: data.family,  num: 0 }, 
        { name: 'genus',   value: data.genus,   num: 0 }, 
        { name: 'species', value: data.species, num: 0 }
    ];

    taxonStats.forEach((taxon, index) => {
        const select = `SELECT Count(treatmentId) AS num FROM treatments WHERE deleted = 0 AND ${taxon.name} = '${taxon.value}'`;

        try {
            debug(`ONE TAXONSTATS: ${select}`);
            taxonStats[index].num = db.prepare(select).get().num;
        } 
        catch (error) {
            console.log(error);
        }
    })

    return taxonStats;
};

const getXml = function(treatmentId) {
    const one = treatmentId.substr(0, 1);
    const two = treatmentId.substr(0, 2);
    const thr = treatmentId.substr(0, 3);

    debug(`getting the xml for ${treatmentId}`);

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