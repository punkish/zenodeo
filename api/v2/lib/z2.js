/**************************************
 * abstracted logic for the handler and other functions 
 * for resources that are fetched from Zenodeo
 * - treatments.js
 * - treatmentAuthors.js
 **************************************/

'use strict';

const config = require('config');
const plog = require(config.get('plog'));
const cacheOn = config.get('v2.cache.on');
const uriZenodeo = config.get('v2.uri.zenodeo');
const Utils = require('../utils');
const Database = require('better-sqlite3');
const db = new Database(config.get('data.treatments'));
const dbQueries = new Database(config.get('data.queries'));
const fs = require('fs');

const dd2queries = require('../lib/dd2queries');


const handler = function(plugins) {

    return async function(request, h) {

        const queryObject = request.query;

        // Add names of the resource and the resource's PK
        // Note, these are *not* values, but just keys. For
        // example, 'treatments' and 'treatmentId', not 
        // '000343DSDHSK923HHC9SKKS' (value of 'treatmentId')
        queryObject.resources = plugins._resources;
        queryObject.resourceId = plugins._resourceId;
        queryObject.path = plugins._path;
        
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

                messages.push({label: 'info', params: 'emptying the cache'});
                this.cache.drop(cacheKey);

            }
    
            messages.push({label: 'info', params: 'getting fresh results'});
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

// https://stackoverflow.com/a/18234317/183692
const formatUnicorn = function () {
    
    let str = this.toString().replace(/@(\w+)/g, "'{\$1}'");
    
    if (arguments.length) {

        const t = typeof arguments[0];
        const args = ('string' === t || 'number' === t) ?
            Array.prototype.slice.call(arguments)
            : arguments[0];

        for (let key in args) {
            str = str.replace(new RegExp("\\{" + key + "\\}", "gi"), args[key]);
        }
    }

    return str;
};

String.prototype.formatUnicorn = String.prototype.formatUnicorn || formatUnicorn;

const dataForDelivery = function(t, data, debug) {
    console.log('now in dataDelivery');

    if (cacheOn) {
        return data;
    }
    else {
        const report = { msec: t.msr }

        if (process.env.NODE_ENV === 'test') {
            report.debug = debug;
        }

        const {queryObject, sqls} = debug;
        const inserts = sqls.length;

        const s1 = dbQueries.prepare(`INSERT INTO webqueries (qp) VALUES(@qp) ON CONFLICT(qp) DO UPDATE SET count=count+1`);

        const s2 = dbQueries.prepare('SELECT Max(id) AS id FROM webqueries');

        const s3 = dbQueries.prepare(`INSERT INTO sqlqueries (sql) VALUES(@sql) ON CONFLICT(sql) DO NOTHING`);

        const s4 = dbQueries.prepare('SELECT Max(id) AS id FROM sqlqueries');

        const s5 = dbQueries.prepare('INSERT INTO stats (webqueries_id, sqlqueries_id, timeTaken) VALUES (@webqueries_id, @sqlqueries_id, @timeTaken)');

        if (inserts) {

            try {
                //dbQueries.prepare('BEGIN TRANSACTION').run();

                const qp = JSON.stringify(queryObject);
                s1.run({qp: qp});

                const webqueries_id = s2.get().id;

                for (let i = 0; i < inserts; i++) {

                    const sql = sqls[i].sql.formatUnicorn(queryObject);
                    const t = sqls[i].took;
        
                    s3.run({sql: sql});
                    
                    const sqlqueries_id = s4.get().id;
    
                    s5.run({
                        webqueries_id: webqueries_id, 
                        sqlqueries_id: sqlqueries_id, 
                        timeTaken: t.msr
                    });

                }
            }
            catch (error) {
                console.log(error);
            }
            
        }

        return {
            value: data,
            cached: null,
            report: report
        }
    }

};

const calcSearchCriteria = function(queryObject) {

    // data will hold all the query results to be sent back
    const sc = {};

    // The following params may get added to the queryObject but they 
    // are not used when making the _self, _prev, _next links, or  
    // the search-criteria 
    const exclude = ['path', 'limit', 'offset', 'refreshCache', 'resources', 'resourceId'];

    for (let key in queryObject) {
        if (! exclude.includes(key)) {
            sc[key] = queryObject[key];
        }
    }

    return sc;
};

const getOneRecord = function(queryObject) {

    let timer = process.hrtime();

    const messages = [ {label: 'queryObject', params: queryObject} ];

    // data will hold all the query results to be sent back
    const data = {
        'search-criteria': calcSearchCriteria(queryObject)
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
        const p = { sql: sql, took: Utils.timerFormat(t) };

        messages.push({ label: 'data', params: p });
        debug.sqls.push(p);
    } 
    catch (error) {
        plog.error(error, sql);
    }

    // add a self link to the data
    data._links = Utils.makeSelfLink({
        uri: uriZenodeo, 
        path: queryObject.path, 
        queryString: Object.entries(data['search-criteria'])
            .map(e => e[0] + '=' + e[1])
            .sort()
            .join('&')
    });

    plog.log({ 
        header: 'ONE QUERY', 
        messages: messages, 
        queryObject: queryObject 
    });

    // We are done if no records found
    if (! data['num-of-records']) {
        timer = process.hrtime(timer);
        return dataForDelivery(timer, data, debug);
    }

    // more data from beyond the database
    if (queryObject.resources === 'treatments') {
        if (queryObject.xml && queryObject.xml === 'true') {
            data.records[0].xml = getXml(queryObject.treatmentId);
        }
        
        data.taxonStats = getTaxonStats(q, queryObject, debug);
    }

    data['related-records'] = getRelatedRecords(q, queryObject, debug);

    timer = process.hrtime(timer);
    return dataForDelivery(timer, data, debug);
};

const getManyRecords = async function(queryObject) {

    let timer = process.hrtime();

    const messages = [{label: 'queryObject', params: queryObject}];

    // data will hold all the query results to be sent back
    const data = {
        'search-criteria': calcSearchCriteria(queryObject)
    };

    // calc limit and offset and add them to the queryObject
    // as we will need them for the SQL query
    const page = queryObject.page ? parseInt(queryObject.page) : 1;
    const size = queryObject.size ? parseInt(queryObject.size) : 30;
    const limit = size;
    const offset = (page - 1) * limit;
    queryObject.limit = limit;
    queryObject.offset = offset;

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
        const p = { sql: countSql, took: Utils.timerFormat(t) };

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
        path: queryObject.path,
        queryString: Object.entries(data['search-criteria'])
            .map(e => e[0] + '=' + e[1])
            .sort()
            .join('&')
    });

    // We are done if no records found
    if (! data['num-of-records']) {
        plog.log({ 
            header: 'MANY QUERIES', 
            messages: messages, 
            queryObject: queryObject 
        });

        timer = process.hrtime(timer);
        return dataForDelivery(timer, data, debug);
    }
    
    // get the records
    const dataSql = q.essential.data.sql;

    try {

        let t = process.hrtime();

        data.records = db.prepare(dataSql).all(queryObject) || [];

        t = process.hrtime(t);
        const p = { sql: countSql, took: Utils.timerFormat(t) };

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
            rec._links = Utils.makeSelfLink({
                uri: uriZenodeo, 
                path: queryObject.path,
                queryString: Object.entries({
                    key: queryObject.resourceId,
                    val: rec[queryObject.resourceId]
                }).map(e => e[1]).join('=')
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
    data.from = ((queryObject.page - 1) * queryObject.limit) + 1;
    data.to = data.records.length < queryObject.limit ? 
        data.from + data.records.length - 1 : 
        data.from + queryObject.limit - 1;

    data.previd = id;

    data.prevpage = queryObject.page >= 1 ? queryObject.page - 1 : '';
    data.nextpage = data.records.length < queryObject.limit ? '' : parseInt(queryObject.page) + 1;

    data._links.prev = Utils.makeLink({
        uri: uriZenodeo, 
        path: queryObject.path,
        queryString: Object.entries(data['search-criteria'])
            .map(e => e[0] + '=' + (e[0] === 'page' ? data.prevpage : e[1]))
            .sort()
            .join('&')
    });

    data._links.next = Utils.makeLink({
        uri: uriZenodeo, 
        path: queryObject.path,
        queryString: Object.entries(data['search-criteria'])
            .map(e => e[0] + '=' + (e[0] === 'page' ? data.nextpage : e[1]))
            .sort()
            .join('&')
    });

    // finally, get facets and stats, if requested 
    const groupedQueries = ['facets', 'stats'];
    groupedQueries.forEach(g => {
        if (g in queryObject && queryObject[g] === 'true') {
            data[g] = getStatsFacets(g, q, queryObject, debug);
        }
    });

    // all done
    timer = process.hrtime(timer);
    return dataForDelivery(timer, data, debug);
};

const getStatsFacets = function(type, q, queryObject, debug) {

    const result = {};
    const messages = [];

    for (let query in q[type]) {

        let t = process.hrtime();

        const sql = q[type][query].sql;

        try {
            result[query] = db.prepare(sql).all(queryObject);
        }
        catch (error) {
            plog.error(error, sql);
        }

        t = process.hrtime(t);

        const p = { sql: sql, took: Utils.timerFormat(t) };
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

        const p = { sql: sql, took: Utils.timerFormat(t) };
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

        const p = { sql: sql, took: Utils.timerFormat(t) };
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