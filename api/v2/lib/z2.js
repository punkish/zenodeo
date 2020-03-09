/**************************************
 * abstracted logic for the handler and other functions 
 * for resources that are fetched from Zenodeo
 * - treatments.js
 * - treatmentAuthors.js
 **************************************/

'use strict';

const config = require('config');
const plog = require(config.get('plog'));
const Schema = require('../schema.js');
const cacheOn = config.get('v2.cache.on');
const uriZenodeo = config.get('v2.uri.zenodeo');
const queryMaker = require('../lib/query-maker');
const Utils = require('../utils');
const Database = require('better-sqlite3');
const db = new Database(config.get('data.treatments'));
const fs = require('fs');

const handler = function(plugins) {

    return async function(request, h) {

        const queryObject = request.query;
        
        // bunch up messages to print them to the log
        const messages = [{label: 'queryObject', params: queryObject}];

        if (plugins._resources === 'treatments') {

            // if xml is being requested, send it back and be done with it
            if (queryObject.format && queryObject.format === 'xml') {
        
                plog.log({ header: 'WEB QUERY', messages: messages });
                return h.response(getXml(queryObject.treatmentId))
                    .type('text/xml')
                    .header('Content-Type', 'application/xml');
        
            }
        }
    
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
            result = getRecords({cacheKey, plugins});
        }

        return result;
        
    };

};

const getRecords = function({cacheKey, plugins}) {

    const queryObject = Utils.makeQueryObject(cacheKey);

    // A resourceId is present. The query is for a specific
    // record. All other query params are ignored
    if (queryObject[plugins._resourceId]) {
        return getOneRecord(queryObject, plugins);
    }
    
    // More complicated queries with search parameters
    else {
        return getManyRecords(queryObject, plugins)
    }
};

const getOneRecord = function(queryObject, plugins) {

    const [queries, queriesLog] = queryMaker(queryObject, plugins);
    const sqlLog = queriesLog.data.sql;
    const sql = queries.data.sql;

    const messages = [ {label: 'queryObject', params: queryObject} ];

    // data will hold all the query results to be sent back
    const data = {

        // deep clone the queryObject
        'search-criteria': JSON.parse(JSON.stringify(queryObject))
    };

    let t = process.hrtime();

    try {

        // add query results to data.records. If no results are found,
        // add an empty array to data.records
        data.records = [db.prepare(sql).get(queryObject)] || [];        
    } 
    catch (error) {
        plog.error(error);
    }

    t = process.hrtime(t);
    messages.push({label: 'data', params: sqlLog});
    messages.push({label: 'took', params: t});

    // if the query is successful, but no records are found
    // add 'num-of-records' = 0
    data['num-of-records'] = data.records ? 1 : 0;
    
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
    plog.log({ header: 'ONE QUERY', messages: messages });

    // We are done if no records found
    if (! data['num-of-records']) return data;

    // more data from beyond the database
    if (plugins._resources === 'treatments') {
        data.xml = getXml(queryObject.treatmentId);
        data.taxonStats = getTaxonStats(data);
    }

    data['related-records'] = getRelatedRecords(queries, queriesLog, queryObject);
    return data;
};

const getManyRecords = async function(queryObject, plugins) {

    // create a deep copy of the queryObject to be used later for 
    // making _links
    const origQueryObject = JSON.parse(JSON.stringify(queryObject));

    // calc limit and offset and add them to the queryObject
    const page = queryObject.page ? parseInt(queryObject.page) : 1;
    const limit = Schema.defaults.size;
    const offset = (page - 1) * limit;
    queryObject.limit = limit;
    queryObject.offset = offset;

    const id = queryObject.id ? parseInt(queryObject.id) : 0;

    const [queries, queriesLog] = queryMaker(queryObject, plugins);
    const messages = [{label: 'queryObject', params: queryObject}];

    // data will hold all the query results to be sent back
    const data = {

        // deep clone the queryObject
        'search-criteria': JSON.parse(JSON.stringify(queryObject))
    };

    let t = process.hrtime();

    // first find total number of matches
    try {
        data['num-of-records'] = db.prepare(queries.count)
            .get(queryObject)
            .numOfRecords;
    }
    catch (error) {
        plog.error(error, queriesLog.count);
    }

    t = process.hrtime(t);
    messages.push({label: 'count', params: queriesLog.count});
    messages.push({label: 'took', params: t});    

    // add a self link to the data
    data._links = {};
    data._links.self = Utils.makeLink({
        uri: uriZenodeo, 
        resource: plugins._resources, 
        queryString: Object.entries(origQueryObject)
            .map(e => e[0] + '=' + e[1])
            .sort()
            .join('&')
    });

    // We are done if no records found
    if (! data['num-of-records']) return data;
    
    t = process.hrtime();

    // get the records
    try {
        data.records = db.prepare(queries.data).all(queryObject) || [];
    }
    catch (error) {
        plog.error(error);
    }

    t = process.hrtime(t);
    messages.push({label: 'data', params: queriesLog.data});
    messages.push({label: 'took', params: t});

    plog.log({ header: 'MANY QUERIES', messages: messages });

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
    data.from = ((page - 1) * limit) + 1;
    data.to = data.records.length < limit ? 
        data.from + data.records.length - 1 : 
        data.from + limit - 1;

    data.previd = id;

    data.prevpage = page >= 1 ? page - 1 : '';
    data.nextpage = data.records.length < limit ? '' : parseInt(page) + 1;

    data._links.prev = Utils.makeLink({
        uri: uriZenodeo, 
        resource: plugins._resources, 
        queryString: Object.entries(origQueryObject)
            .map(e => e[0] + '=' + (e[0] === 'page' ? data.prevpage : e[1]))
            .sort()
            .join('&')
    });

    data._links.next = Utils.makeLink({
        uri: uriZenodeo, 
        resource: plugins._resources, 
        queryString: Object.entries(origQueryObject)
            .map(e => e[0] + '=' + (e[0] === 'page' ? data.nextpage : e[1]))
            .sort()
            .join('&')
    });

    // finally, get facets and stats, if requested 
    const groupedQueries = ['facets', 'stats'];
    groupedQueries.forEach(g => {
        if (g in queryObject && queryObject[g] === 'true') {
            data[g] = getStatsFacets(g, queries, queriesLog, queryObject);
        }
    });

    // all done
    return data;
};

const getStatsFacets = function(type, queries, queriesLog, queryObject) {
    const result = {};
    const messages = [];

    if (queries[type]) {
        for (let q in queries[type]) {

            let t = process.hrtime();

            try {
                result[q] = db.prepare(queries[type][q]).all(queryObject);
            }
            catch (error) {
                plog.error(error);
            }

            t = process.hrtime(t);
            messages.push({label: q, params: queriesLog[type][q]});
            messages.push({label: 'took', params: t});
        }
    }

    plog.log({ header: `MANY ${type.toUpperCase()}`, messages: messages });
    return result;
};

const getRelatedRecords = function(queries, queriesLog, queryObject) {

    const related = {};
    const messages = [];

    if (queries.related) {
        for (let relatedResource in queries.related) {

            const pk = queries.related[relatedResource].pk;
            const sqlLog = queriesLog.related[relatedResource].sql;
            const sql = queries.related[relatedResource].sql;

            let t = process.hrtime();

            try {
                related[relatedResource] = Utils.halify({
                    records: db.prepare(sql).all(queryObject), 
                    uri: uriZenodeo, 
                    resource: relatedResource,
                    id: pk
                });
            }
            catch (error) {
                plog.error(error);
            }

            t = process.hrtime(t);
            messages.push({label: relatedResource, params: sqlLog});
            messages.push({label: 'took', params: t});
        }
    }

    plog.log({ header: 'ONE RELATED', messages: messages });
    return related;
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
        const select = `SELECT Count(*) AS num FROM treatments WHERE deleted = 0 AND ${taxon.name} = '${taxon.value}'`;
          

        let t = process.hrtime();

        try {
            taxonStats[index].num = db.prepare(select).get().num;
        } 
        catch (error) {
            plog.error(error);
        }

        t = process.hrtime(t);
        messages.push({label: taxon.name, params: select});
        messages.push({label: 'took', params: t});
    })

    plog.log({ header: 'ONE TAXONSTATS', messages: messages });
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

module.exports = {handler, getRecords};