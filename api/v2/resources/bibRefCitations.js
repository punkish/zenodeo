'use strict';

const Schema = require('../schema.js');
const ResponseMessages = require('../../responseMessages');
const debug = require('debug')('v2:bibRefCitations');
const config = require('config');
const Utils = require('../utils');

const uriZenodeo = config.get('uri.zenodeo') + '/v2';
const cacheOn = config.get('cache.v2.on');

const Database = require('better-sqlite3');
const db = new Database(config.get('data.treatments'));

String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
        return typeof args[number] != 'undefined' ? args[number] : match;
    });
};

const _resource = 'bibRefCitations'; 
const _plugin = 'bibRefCitations2';
const _segment = 'bibRefCitations2';
const _path = '/bibrefcitations'; // impt: lowercase, because used in URI
const _resourceId = 'bibRefCitationsId';

const _select = {
    none: {
        stats: [
            `SELECT Count(*) AS ${_resource} FROM ${_resource} WHERE deleted = 0`
        ]
    },
    one: {
        data: 'SELECT bibRefCitationId, treatmentId, refString FROM bibRefCitations WHERE bibRefCitationId = @bibRefCitationId',
        
        related: {
            treatments: 'SELECT t.id, t.treatmentId, t.treatmentTitle, authorityName || ". " || authorityYear || ". <i>" || articleTitle || ".</i> " || journalTitle || ", " || journalYear || ", pp. " || pages || ", vol. " || journalVolume || ", issue " || journalIssue AS context FROM treatments t JOIN bibRefCitations b ON t.treatmentId = b.treatmentId WHERE b.bibRefCitationId = @bibRefCitationId',
        }
    },
    many: {
        q: {
            count: 'SELECT Count(bibRefCitationId) AS numOfRecords FROM vbibrefcitations WHERE vbibrefcitations MATCH @q',
            
            data: 'SELECT id, b.bibRefCitationId, b.treatmentId, b.refString AS context FROM bibRefCitations b JOIN vbibrefcitations v ON b.bibRefCitationId = v.bibRefCitationId WHERE vbibrefcitations MATCH @q LIMIT @limit OFFSET @offset',
            
            stats: [
                'SELECT Count(*) AS "bibref citations" FROM bibRefCitations b JOIN vfigureCitations v ON b.bibRefCitationId = v.figureCitationId WHERE vfigurecitations MATCH @q'
            ]
        },

        other: {
            count: 'SELECT Count(id) AS numOfRecords FROM bibRefCitations WHERE {0}',

            data: 'SELECT id, bibRefCitationId, treatmentId, refString FROM bibRefCitations WHERE {0} LIMIT @limit OFFSET @offset',

            stats: [
                'SELECT Count(*) AS "bibref citations" FROM bibRefCitations b JOIN treatments t ON b.treatmentId = t.treatmentId WHERE {0}'
            ]
        }
    }
};

module.exports = {
    plugin: {
        name: _plugin,
        register: function(server, options) {

            const cache = Utils.makeCache({
                server: server, 
                options: options, 
                query: getRecords,  
                segment: _segment
            });

            // binds the cache to every route registered  
            // **within this plugin** after this line
            server.bind({ cache });

            server.route([{ 
                path: _path,   
                method: 'GET', 
                config: {
                    description: `Retrieve ${_resource}`,
                    tags: [_resource, 'api'],
                    plugins: {
                        'hapi-swagger': {
                            order: 6,
                            responseMessages: ResponseMessages
                        }
                    },
                    validate: Schema[_resource],
                    notes: [
                        `This is the main route for retrieving ${_resource} for treatments from the database.`
                    ]
                },
                handler 
            }]);
        },
    },
};

const handler = function(request, h) {

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
    debug(`queryObject: ${JSON.stringify(queryObject)}`);

    // A resourceId is present. The query is for a specific
    // record. All other query params are ignored
    if (queryObject[_resourceId]) {
        return getOneRecord(queryObject);
    }
    
    // More complicated queries with search parameters
    else {
        return getManyRecords(queryObject);
    }
};

const getOneRecord = function(queryObject) {    
    let data;
    try {
        debug(`sel.one.data: ${_select.one.data}`);
        data = db.prepare(_select.one.data).get(queryObject) || { 'num-of-records': 0 };
    } 
    catch (error) {
        console.log(`error: ${error}`);
    }

    data['search-criteria'] = queryObject;
    data._links = Utils.makeSelfLink({
        uri: uriZenodeo, 
        resource: _resource.toLowerCase(), 
        queryString: Object.entries(queryObject)
            .map(e => e[0] + '=' + e[1])
            .sort()
            .join('&')
    });

    if (data['num-of-records']) {
        data['related-records'] = getRelatedRecords(queryObject);
    }

    return data;
};

const getManyRecords = function(queryObject) {
    const data = {};
    let selectCount;
    let selectData;
    let selectStatsQueries;

    // if 'q' then a full text search
    if (queryObject.q) {
        selectCount = _select.many.q.count;
        selectData = _select.many.q.data;
        selectStatsQueries = _select.many.q.stats;
    }

    // everything else
    else {

        // first, figure out the cols and params 
        const cols = [];
        const vals = [];
        const searchCriteria = {}; 

        for (let col in queryObject) {

            if (col !== 'id') {
                vals.push( queryObject[col] );
                searchCriteria[col] = queryObject[col];

                // we add double quotes to 'order' otherwise the sql 
                // statement would choke since order is a reserved word
                if (col === 'order') {
                    cols.push('"order" = @order');
                }
                else {
                    cols.push(`${col} = @${col}`);
                }
                
            }

        }

        const where = cols.join(' AND ');
        selectCount = _select.many.other.count.format(where);
        selectData = _select.many.other.data.format(where);
        selectStatsQueries = _select.many.other.stats.map(s => s.format(where));
        
    }

    // first find total number of matches
    try {
        data['num-of-records'] = db.prepare(selectCount)
            .get(queryObject)
            .numOfRecords;
    }
    catch (error) {
        console.log(error);
    }

    data['search-criteria'] = queryObject;
    data._links = Utils.makeSelfLink({
        uri: uriZenodeo, 
        resource: 'bibrefcitations', 
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
    const id = queryObject.id ? parseInt(queryObject.id) : 0;
    const offset = id * 30;
    const limit = 30;

    data.statistics = Utils.calcStats({
        queries: selectStatsQueries, 
        queryObject: queryObject
    });

    // get the records
    try {
        const queryObjectTmp = {};
        for (let k in queryObject) {
            queryObjectTmp[k] = queryObject[k];
        }
        queryObjectTmp.limit = limit;
        queryObjectTmp.offset = offset;

        data.records = db.prepare(selectData).all(queryObjectTmp);
    }
    catch (error) {
        console.log(error);
    }

    data.records.forEach(rec => {
        rec._links = Utils.makeSelfLink({
            uri: uriZenodeo, 
            resource: 'bibrefcitations', 
            queryString: Object.entries({
                bibRefCitationId: rec.bibRefCitationId
            })
                .map(e => e[0] + '=' + e[1])
                .sort()
                .join('&')
        });
    })

    // set some records-specific from and to for pagination
    data.from = (id * 30) + 1;
    data.to = data.records.length < limit ? 
        data.from + data.records.length - 1 : 
        data.from + limit - 1;

    data.previd = id >= 1 ? id - 1 : '';
    data.nextid = data.records.length < limit ? '' : parseInt(id) + 1;

    return data;
};

// end boiler plate ******************************/

const getRelatedRecords = function(queryObject) {
    const rr = {};

    const relatedRecords = _select.one.related;
    for (let relatedResource in relatedRecords) {

        try {
            const select = relatedRecords[relatedResource];
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

    console.log(rr)
    return rr;
};