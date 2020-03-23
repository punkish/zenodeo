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
const getSql = require('../lib/qm').getSql;
const Utils = require('../utils');
const Database = require('better-sqlite3');
const db = new Database(config.get('data.treatments'));
const fs = require('fs');
const qParts = require('./qparts');

const handler = function(plugins) {

    return async function(request, h) {

        const queryObject = request.query;

        // Add names of the resource and the resource's PK
        // Note, these are *not* values, but just keys. For
        // example, 'treatments' and 'treatmentId', not 
        // '000343DSDHSK923HHC9SKKS' (value of 'treatmentId')
        queryObject.resources = plugins._resources;
        queryObject.resourceId = plugins._resourceId;
        
        // bunch up messages to print them to the log
        const messages = [{label: 'queryObject', params: queryObject}];

        if (queryObject.resources === 'treatments') {

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
            result = getRecords(cacheKey);
        }

        return result;
        
    };

};

const getAllLikes = function(queryObject) {

    const resourceLike = qParts[queryObject.resources].queryable.like;
    for (let key in queryObject) {
        if (key in resourceLike) {
            queryObject[key] =queryObject[key] + '%';
        }
    }
};

const getRecords = function(cacheKey) {

    const queryObject = Utils.makeQueryObject(cacheKey);

    // A resourceId is present. The query is for a specific
    // record. All other query params are ignored
    if (queryObject[queryObject.resourceId]) {
        return getOneRecord(queryObject);
    }
    
    // More complicated queries with search parameters
    else {
        return getManyRecords(queryObject)
    }
};

const getOneRecord = function(queryObject) {

    const q = getSql(queryObject);
    const sqlLog = q.queriesLog.essential.data.sql;
    const sql = q.queriesLog.essential.data.sql;

    const messages = [ {label: 'queryObject', params: queryObject} ];

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

    let t = process.hrtime();

    try {

        // add query results to data.records. If no results are found,
        // add an empty array to data.records
        data.records = [db.prepare(sql).get(queryObject)] || [];        
    } 
    catch (error) {
        plog.error(error, sqlLog);
    }

    t = process.hrtime(t);
    messages.push({
        label: 'data', 
        params: { sql: sqlLog, took: t }
    });

    // if the query is successful, but no records are found
    // add 'num-of-records' = 0
    data['num-of-records'] = data.records ? 1 : 0;
    
    // add a self link to the data
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

    // We are done if no records found
    if (! data['num-of-records']) return data;

    // more data from beyond the database
    if (queryObject.resources === 'treatments') {
        if (queryObject.xml) {
            data.xml = getXml(queryObject.treatmentId);
        }
        
        data.taxonStats = getTaxonStats(data);
    }

    data['related-records'] = getRelatedRecords(q, queryObject);
    return data;
};

const getManyRecords = async function(queryObject) {

    // calc limit and offset and add them to the queryObject
    const page = queryObject.page ? parseInt(queryObject.page) : 1;
    const limit = Schema.defaults.size;
    const offset = (page - 1) * limit;
    queryObject.limit = limit;
    queryObject.offset = offset;

    getAllLikes(queryObject);

    const id = queryObject.id ? parseInt(queryObject.id) : 0;

    const q = getSql(queryObject);
    const messages = [{label: 'queryObject', params: queryObject}];

    // data will hold all the query results to be sent back
    const data = { 'search-criteria': {} };

    // The following params may get added to the queryObject but they 
    // are not used when making the _self, _prev, _next links, or  
    // the search-criteria 
    const exclude = ['resources', 'limit', 'offset', 'refreshCache', 'resources', 'resourceId'];

    for (let key in queryObject) {
        if (! exclude.includes(key)) {
            data['search-criteria'][key] = queryObject[key];
        }
    }

    let t = process.hrtime();

    // first find total number of matches
    const countSql = q.queries.essential.count.sql;
    const countSqlLog = q.queriesLog.essential.count.sql;

    try {
        data['num-of-records'] = db.prepare(countSql)
            .get(queryObject)
            .numOfRecords;
    }
    catch (error) {
        plog.error(error, countSqlLog);
    }

    t = process.hrtime(t);
    messages.push({
        label: 'count', 
        params: { sql: countSqlLog, took: t }
    });

    // add a self link to the data
    data._links = {};
    data._links.self = Utils.makeLink({
        uri: uriZenodeo, 
        resource: queryObject.resources, 
        queryString: Object.entries(data['search-criteria'])
            .map(e => e[0] + '=' + e[1])
            .sort()
            .join('&')
    });

    // We are done if no records found
    if (! data['num-of-records']) return data;
    
    t = process.hrtime();

    // get the records
    const dataSql = q.queries.essential.data.sql;
    const dataSqlLog = q.queriesLog.essential.data.sql;

    try {
        data.records = db.prepare(dataSql).all(queryObject) || [];
    }
    catch (error) {
        plog.error(error, dataSqlLog);
    }

    t = process.hrtime(t);
    messages.push({
        label: 'data', 
        params: { sql: dataSqlLog, took: t }
    });

    plog.log({ header: 'MANY QUERIES', messages: messages });

    if (data.records.length > 0) {
        data.records.forEach(rec => {
            rec._links = Utils.makeSelfLink({
                uri: uriZenodeo, 
                resource: queryObject.resources, 
                queryString: Object.entries({
                    treatmentId: rec[queryObject.resourceId]
                })
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

    // finally, get facets and stats, if requested 
    const groupedQueries = ['facets', 'stats'];
    groupedQueries.forEach(g => {
        if (g in queryObject && queryObject[g] === 'true') {
            data[g] = getStatsFacets(g, q, queryObject);
        }
    });

    // all done
    return data;
};

const getStatsFacets = function(type, q, queryObject) {
    const result = {};
    const messages = [];

    for (let query in q.queries[type]) {

        let t = process.hrtime();

        const sql = q.queries[type][query].sql;
        const sqlLog = q.queriesLog[type][query].sql;

        try {
            result[query] = db.prepare(sql).all(queryObject);
        }
        catch (error) {
            plog.error(error, sqlLog);
        }

        t = process.hrtime(t);
        messages.push({
            label: query, 
            params: { sql: sqlLog, took: t }
        });
        
    }

    plog.log({ header: `${type.toUpperCase()} QUERIES`, messages: messages });

    return result;
};

const getRelatedRecords = function(q, queryObject) {

    const related = {};
    const messages = [];

    for (let query in q.queries.related) {

        const pk = q.queries.related[query].pk;
        const sqlLog = q.queriesLog.related[query].sql;
        const sql = q.queries.related[query].sql;

        let t = process.hrtime();

        try {
            related[query] = Utils.halify({
                records: db.prepare(sql).all(queryObject), 
                uri: uriZenodeo, 
                resource: query,
                id: pk
            });
        }
        catch (error) {
            plog.error(error, sqlLog);
        }

        t = process.hrtime(t);
        messages.push({
            label: query, 
            params: { sql: sqlLog, took: t }
        });

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
        const sql = `SELECT Count(*) AS num FROM treatments WHERE deleted = 0 AND ${taxon.name} = '${taxon.value}'`;

        let t = process.hrtime();

        try {
            taxonStats[index].num = db.prepare(sql).get().num;
        } 
        catch (error) {
            plog.error(error, sql);
        }

        t = process.hrtime(t);
        messages.push({
            label: taxon.name, 
            params: { sql: sql, took: t }
        });
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