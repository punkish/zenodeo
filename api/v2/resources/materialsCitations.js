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

const _plugin = 'materialsCitations2';
const _resource = 'materialscitations';  // impt: lowercase, because used in URI
const _resourceId = 'materialsCitationId';
const _select = {
    none: {
        stats: {
            'materials citations by numbers': [
                'SELECT Count(*) AS "materials citations" FROM materialsCitations',
        
                'SELECT Count(DISTINCT collectionCode) AS "collection codes" FROM materialsCitations',
        
                'SELECT Count(DISTINCT collectingCountry) AS "collecting countries" FROM materialsCitations',
        
                'SELECT Sum(specimenCountFemale) AS "total female specimens" FROM materialsCitations',
        
                'SELECT Sum(specimenCountMale) AS "total male specimens" FROM materialsCitations',
        
                'SELECT Sum(specimenCount) AS "total specimens" FROM materialsCitations'
            ],
        
            'materials citations x collection codes': [
                'SELECT DISTINCT collectionCode AS "collection codes", Count(*) AS "materials citations" FROM materialsCitations GROUP BY collectionCode ORDER BY "materials citations" DESC LIMIT 10'
            ],
            
            'materials citations x collecting countries': [
                'SELECT DISTINCT collectingCountry AS "collecting country", Count(*) AS "materials citations" FROM materialsCitations GROUP BY collectingCountry ORDER BY "materials citations"'
            ]
        }
    },
    one: {
        data: 'SELECT materialsCitationId, treatmentId, collectionCode, specimenCountFemale, specimenCountMale, specimenCount, specimenCode, typeStatus, collectingCountry, collectingRegion, collectingMunicipality, collectingCounty, location, locationDeviation, determinerName, collectorName, collectingDate, collectedFrom, collectingMethod, latitude, longitude, elevation, httpUri FROM materialsCitations WHERE materialsCitationId = @materialsCitationId',
        
        related: {
            treatments: 'SELECT t.id, t.treatmentId, t.treatmentTitle, authorityName || ". " || authorityYear || ". <i>" || articleTitle || ".</i> " || journalTitle || ", " || journalYear || ", pp. " || pages || ", vol. " || journalVolume || ", issue " || journalIssue AS context FROM treatments t JOIN materialsCitations m ON t.treatmentId = m.treatmentId WHERE m.materialsCitationId = @materialsCitationId',
        }
    },
    many: {
        count: 'SELECT Count(id) AS numOfRecords FROM materialsCitations WHERE {0}',

        data: 'SELECT id, materialsCitationId, treatmentId, collectionCode, specimenCountFemale, specimenCountMale, specimenCount, specimenCode, typeStatus, collectingCountry, collectingRegion, collectingMunicipality, collectingCounty, location, locationDeviation, determinerName, collectorName, collectingDate, collectedFrom, collectingMethod, latitude, longitude, elevation, httpUri FROM materialsCitations WHERE {0} LIMIT @limit OFFSET @offset',

        stats: {
            'materials citations by numbers': [
                'SELECT Count(*) AS "materials citations" FROM materialsCitations WHERE {0}',
        
                'SELECT Count(DISTINCT collectionCode) AS "collection codes" FROM materialsCitations WHERE {0}',
        
                'SELECT Count(DISTINCT collectingCountry) AS "collecting countries" FROM materialsCitations WHERE {0}',
        
                'SELECT Sum(specimenCountFemale) AS "total female specimens" FROM materialsCitations WHERE {0}',
        
                'SELECT Sum(specimenCountMale) AS "total male specimens" FROM materialsCitations WHERE {0}',
        
                'SELECT Sum(specimenCount) AS "total specimens" FROM materialsCitations WHERE {0}'
            ],
        
            'materials citations x collection codes': [
                'SELECT DISTINCT collectionCode AS "collection codes", Count(*) AS "materials citations" FROM materialsCitations WHERE {0} GROUP BY collectionCode ORDER BY "materials citations" DESC LIMIT 10'
            ],
            
            'materials citations x collecting countries': [
                'SELECT DISTINCT collectingCountry AS "collecting country", Count(*) AS "materials citations" FROM materialsCitations WHERE {0} GROUP BY collectingCountry ORDER BY "materials citations"'
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
                    description: "Retrieve materials citations",
                    tags: ['treatments', 'materials reference citations', 'api'],
                    plugins: {
                        'hapi-swagger': {
                            order: 7,
                            responseMessages: ResponseMessages
                        }
                    },
                    //validate: Schema.treatments,
                    notes: [
                        'This is the main route for retrieving materials citations for treatments from the database.',
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
        return Utils.calcStats({stats: _select.none.stats})
    }

     // A resourceId is present. The query is for a specific
    // record. All other query params are ignored
    else if (queryObject[_resourceId]) {
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
    
    // to be used for lat/lon queries
    const range = 0.9;

    // first, figure out the cols and params 
    const cols = [];

    for (let col in queryObject) {

        if (col !== 'id') {
            
            // we add double quotes to 'order' otherwise the sql 
            // statement would choke since order is a reserved word
            if (col === 'order') {
                cols.push('"order" = @order');
            }
            else if (col === 'lat') {
                cols.push('latitude > @min_latitude');
                cols.push('latitude < @max_latitude');
                queryObject.min_latitude = queryObject.lat - range;
                queryObject.max_latitude = +queryObject.lat + range;
            }
            else if (col === 'lon') {
                cols.push('longitude > @min_longitude');
                cols.push('longitude < @max_longitude');
                queryObject.min_longitude = queryObject.lon - range;
                queryObject.max_longitude = +queryObject.lon + range;
            }
            else {
                cols.push(`${col} = @${col}`);
            }
            
        }

    }

    const where = cols.join(' AND ');
    const selectCount = _select.many.count.format(where);
    const selectData = _select.many.data.format(where);
    const selectStats =  {};
    for (let chart in _select.many.stats) {
        selectStats[chart] = _select.many.stats[chart].map(s => s.format(where))
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
            .filter(e => 
                e[0] !== 'min_latitude' && e[0] !== 'max_latitude' && e[0] !== 'min_longitude' && e[0] !== 'max_longitude'
            )
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
        stats: selectStats, 
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
                materialsCitationId: rec.materialsCitationId
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