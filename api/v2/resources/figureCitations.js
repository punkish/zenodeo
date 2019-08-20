'use strict';

const Schema = require('../schema.js');
const ResponseMessages = require('../../responseMessages');
const debug = require('debug')('v2:figureCitations');
const Database = require('better-sqlite3');
const config = require('config');
const db = new Database(config.get('data.treatments'));
const Utils = require('../utils');

const uri = config.get('uri.zenodeo') + '/v2';

String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
        return typeof args[number] != 'undefined' ? args[number] : match;
    });
};

const _plugin = 'figureCitations2';
const _resource = 'figurecitations';  // impt: lowercase, because used in URI
const _resourceId = 'figureCitationId';
const _select = {
    none: {
        stats: [
            'SELECT Count(*) AS "figure citations" FROM figureCitations'
        ]
    },
    one: {
        data: 'SELECT figureCitationId, treatmentId, captionText, httpUri, thumbnailUri FROM figureCitations WHERE figureCitationId = @figureCitationId',
        
        related: {
            treatments: 'SELECT t.id, t.treatmentId, t.treatmentTitle, authorityName || ". " || authorityYear || ". <i>" || articleTitle || ".</i> " || journalTitle || ", " || journalYear || ", pp. " || pages || ", vol. " || journalVolume || ", issue " || journalIssue AS context FROM treatments t JOIN figureCitations f ON t.treatmentId = f.treatmentId WHERE f.figureCitationId = @figureCitationId',
        }
    },
    many: {
        q: {
            count: 'SELECT Count(figureCitationId) AS numOfRecords FROM vfigureCitations WHERE vfigurecitations MATCH @q',
            
            data: 'SELECT id, f.figureCitationId, f.treatmentId, f.captionText AS context, httpUri, thumbnailUri FROM figureCitations f JOIN vfigureCitations v ON f.figureCitationId = v.figureCitationId WHERE vfigurecitations MATCH @q LIMIT @limit OFFSET @offset',
            
            stats: [
                'SELECT Count(*) AS "figure citations" FROM figureCitations f JOIN vfigureCitations v ON f.figureCitationId = v.figureCitationId WHERE vfigurecitations MATCH @q'
            ]
        },

        other: {
            count: 'SELECT Count(id) AS numOfRecords FROM figureCitations WHERE {0}',

            data: 'SELECT id, figureCitationId, treatmentId, captionText, httpUri, thumbnailUri FROM figureCitations WHERE {0} LIMIT @limit OFFSET @offset',

            stats: [
                'SELECT Count(*) AS "figure citations" FROM figureCitations f JOIN treatments t ON f.treatmentId = t.treatmentId WHERE {0}'
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
                segment: _plugin
            });

            // binds the cache to every route registered  
            // **within this plugin** after this line
            server.bind({ cache });

            server.route([{ 
                path: `/${_resource}`,  
                method: 'GET', 
                config: {
                    description: "Retrieve figure citations",
                    tags: ['treatments', 'figure citations', 'api'],
                    plugins: {
                        'hapi-swagger': {
                            order: 4,
                            responseMessages: ResponseMessages
                        }
                    },
                    //validate: Schema.treatments,
                    notes: [
                        'This is the main route for retrieving figure citations for treatments from the database.',
                    ]
                },
                handler 
            }]);
        },
    },
};

const handler = function(request, h) {
    //preprocess(request, h);
    
    const cacheKey = Utils.makeCacheKey(request);

    if (request.query.refreshCache === 'true') {
        debug('forcing refreshCache')
        this.cache.drop(cacheKey);
    }

    return this.cache.get(cacheKey);
};

const getRecords = function(cacheKey) {
    const queryObject = Utils.makeQueryObject(cacheKey);

    if (Object.keys(queryObject).length === 0) {
        return Utils.calcStats({queries: _select.none.stats})
    }

     // A resourceId is present. The query is for a specific
    // record. All other query params are ignored
    else if (queryObject[_resourceId]) {
        //return 'getting one record for ' + queryObject[_resourceId];
        return getOneRecord(queryObject);
    }
    
    // More complicated queries with search parameters
    else {
        //return 'getting many records for ' + queryObject;
        return getManyRecords(queryObject);
    }
};

const getOneRecord = function(queryObject) {    
    let data;
    try {
        data = db.prepare(_select.one.data).get(queryObject);
    } 
    catch (error) {
        console.log(`error: ${error}`);
    }

    data['search-criteria'] = queryObject;
    
    data._links = Utils.makeSelfLink({
        uri: uri, 
        resource: _resource, 
        queryString: Object.entries(queryObject)
            .map(e => e[0] + '=' + e[1])
            .sort()
            .join('&')
    });

    data['related-records'] = getRelatedRecords(queryObject);
    return data
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
        uri: uri, 
        resource: _resource, 
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
            uri: uri, 
            resource: _resource, 
            queryString: Object.entries({
                figureCitationId: rec.figureCitationId
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
                uri: uri, 
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