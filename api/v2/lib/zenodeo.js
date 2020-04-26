'use strict';

/*******************************************************
 * 
 * A factory function with abstracted logic for the 
 * handler and other functions for the related resources  
 * that are fetched from Zenodeo
 * 
 * - treatmentAuthors (core)
 * - materialsCitations
 * - treatmentCitations
 * - bibRefCitations
 * - figureCitations
 * 
 ******************************************************/

const config = require('config');
const plog = require(config.get('plog'));
const cacheOn = config.get('v2.cache.on');
const uriZenodeo = config.get('v2.uri.zenodeo');
const Utils = require('../utils');
const Database = require('better-sqlite3');
const db = new Database(config.get('data.treatments'));
const dd2queries = require('../lib/dd2queries');

const handler = function(resource) {

    return async function(request, h) {

        const queryObject = Utils.modifyIncomingQueryObject(request.query, resource);
        
        // bunch up messages to print them to the log
        const messages = [{label: 'queryObject', params: queryObject}];

        if (queryObject.format && queryObject.format === 'xml') {
    
            plog.log({ header: 'WEB QUERY', messages: messages });
            return h.response(getXml(queryObject.treatmentId))
                .type('text/xml')
                .header('Content-Type', 'application/xml');
            
        }
    
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

    let timer = process.hrtime();

    const messages = [ {label: 'queryObject', params: queryObject} ];

    // data will hold all the query results to be sent back
    const data = {
        'search-criteria': Utils.makeSearchCriteria(queryObject)
    };

    const q = dd2queries(queryObject);

    // this is where we will store the various SQL statements 
    // and their performance metrics so we can store them in a db
    const debug = {
        queryObject: queryObject,
        sqls: []
    };

    const sql = q.essential.data.sql;

    try {

        let t = process.hrtime();

        // add query results to data.records. If no results are found,
        // add an empty array to data.records
        const records = db.prepare(sql).get(queryObject);
        if (records) {
            data.records = [ records ];
            data['num-of-records'] = 1;
        }
        else {
            data.records = [];
            data['num-of-records'] = 0;
        }

        t = process.hrtime(t);
        const p = { sql: sql.formatUnicorn(queryObject), took: Utils.timerFormat(t) };

        messages.push({ label: 'data', params: p });
        debug.sqls.push(p);
    } 
    catch (error) {
        plog.error(error, sql);
    }

    data._links = {};
    data._links.self = Utils.makeLink({
        uri: uriZenodeo, 
        params: data['search-criteria']
    });

    plog.log({ 
        header: 'ONE QUERY', 
        messages: messages, 
        queryObject: queryObject 
    });

    // We are done if no records found
    if (! data['num-of-records']) {
        timer = process.hrtime(timer);
        return Utils.dataForDelivery(timer, data, debug);
    }

    // more data from beyond the database
    if (queryObject.resource === 'treatments') {
        if (queryObject.xml && queryObject.xml === 'true') {
            data.records[0].xml = getXml(queryObject.treatmentId);
        }
        
        data.taxonStats = getTaxonStats(q, queryObject, debug);
    }

    data['related-records'] = getRelatedRecords(q, queryObject, debug);

    timer = process.hrtime(timer);
    return Utils.dataForDelivery(timer, data, debug);
};

const getManyRecords = async function(queryObject) {

    let timer = process.hrtime();

    const messages = [{label: 'queryObject', params: queryObject}];

    // data will hold all the query results to be sent back
    const data = {
        'search-criteria': Utils.makeSearchCriteria(queryObject)
    };

    const q = dd2queries(queryObject);

    
    // this is where we will store the various SQL statements 
    // and their performance metrics so we can store them in a db
    const debug = {
        queryObject: queryObject,
        sqls: []
    };

    const id = queryObject.id ? parseInt(queryObject.id) : 0;

    // first find total number of matches
    const countSql = q.essential.count.sql;

    try {

        let t = process.hrtime();

        data['num-of-records'] = db.prepare(countSql)
            .get(queryObject)
            .numOfRecords;

        t = process.hrtime(t);

        const p = { 
            sql: Utils.strfmt(countSql, queryObject), 
            took: Utils.timerFormat(t) 
        };

        messages.push({ label: 'count', params: p });
        debug.sqls.push(p);
    }
    catch (error) {
        plog.error(error, countSql);
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

        timer = process.hrtime(timer);
        return Utils.dataForDelivery(timer, data, debug);
    }
    
    // The count query above returned a number successfully
    // which is why we have reached here. So now we get the 
    // actual records
    const dataSql = q.essential.data.sql;

    try {

        let t = process.hrtime();

        data.records = db.prepare(dataSql).all(queryObject);

        t = process.hrtime(t);

        const p = { 
            sql: Utils.strfmt(dataSql, queryObject), 
            took: Utils.timerFormat(t) 
        };

        messages.push({ label: 'data', params: p });
        debug.sqls.push(p);
    }
    catch (error) {
        plog.error(error, dataSql);
    }

    plog.log({ 
        header: 'MANY QUERIES', 
        messages: messages,
        queryObject: queryObject
    });

    if (data.records.length > 0) {

        data.records.forEach(rec => {

            rec._links = {};
            rec._links.self = Utils.makeLink({
                uri: uriZenodeo, 
                params: {
                    path: queryObject.path,
                    resourceId: {
                        key: queryObject.resourceId, 
                        val: rec[queryObject.resourceId] 
                    }
                }
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
    const num = data.records.length;
    data.from = ((queryObject.page - 1) * queryObject.size) + 1;
    data.to = num < queryObject.size ? 
        data.from + num - 1 : 
        data.from + queryObject.size - 1;

    data.previd = id;

    data.prevpage = queryObject.page >= 2 ? +queryObject.page - 1 : '';
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
    ['facets', 'stats'].forEach(g => {
        if (g in queryObject && queryObject[g] === 'true') {
            data[g] = getStatsFacets(g, q, queryObject, debug);
        }
    });

    // all done
    timer = process.hrtime(timer);
    return Utils.dataForDelivery(timer, data, debug);
};

const getStatsFacets = function(type, q, queryObject, debug) {

    const result = {};
    const messages = [];

    for (let query in q[type]) {

        let t = process.hrtime();

        const sql = q[type][query].sql;
        const foo = q[type][query].sql;

        try {
            result[query] = db.prepare(sql).all(queryObject);
        }
        catch (error) {
            plog.error(error, Utils.strfmt(sql, queryObject));
        }

        t = process.hrtime(t);

        const p = { 
            sql: Utils.strfmt(sql, queryObject),  
            took: Utils.timerFormat(t) 
        };
        messages.push({ label: query, params: p });
        debug.sqls.push(p);
    }

    plog.log({ 
        header: `${type.toUpperCase()} QUERIES`, 
        messages: messages,
        queryObject: queryObject
    });

    return result;
};

const getRelatedRecords = function(q, queryObject, debug) {
    
    const related = {};
    const messages = [];

    for (let query in q.related) {

        const pk = q.related[query].pk;
        const sql = q.related[query].sql;

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
            plog.error(error, sql);
        }

        t = process.hrtime(t);

        const p = { 
            sql: Utils.strfmt(sql, queryObject),  
            took: Utils.timerFormat(t) 
        };
        debug.sqls.push(p);
        messages.push({ label: query, params: p });

    }

    plog.log({ 
        header: 'ONE RELATED', 
        messages: messages, 
        queryObject: queryObject 
    });

    return related;
};

const getTaxonStats = function(q, queryObject, debug) {

    const taxonStats = {};
    const messages = [];

    for (let query in q.taxonStats) {

        const sql = q.taxonStats[query].sql;

        let t = process.hrtime();

        try {
            taxonStats[query] = db.prepare(sql).get(queryObject).num;
        }
        catch (error) {
            plog.error(error, sql);
        }

        t = process.hrtime(t);

        const p = { 
            sql: Utils.strfmt(sql, queryObject),  
            took: Utils.timerFormat(t) 
        };
        debug.sqls.push(p);
        messages.push({ label: query, params: p });

    }

    plog.log({ 
        header: 'ONE TAXONSTATS', 
        messages: messages, 
        queryObject: queryObject
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

// Not used for now, but saved for posterity
//****************************************************************/
//
// const formatAuthors = function(authors) {
//     let authorsArr = authors.map(a => { return a.author });
//     const numOfAuthors = authorsArr.length;

//     let authorsList = '';
//     if (numOfAuthors === 1) {
//         authorsList = authorsArr[0];
//     }
//     else if (numOfAuthors === 2) {
//         authorsList = authorsArr.join(' and ');
//     }
//     else if (numOfAuthors > 2) {
//         authorsList = authorsArr.slice(0, 2).join(', ');
//         authorsList += ' and ' + authorsArr[numOfAuthors - 1]
//     }

//     return authorsList;
// };

module.exports = { handler, getRecords };
