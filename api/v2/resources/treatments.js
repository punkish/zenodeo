'use strict';

const Schema = require('../schema.js');
const ResponseMessages = require('../../responseMessages');
const debug = require('debug')('v2:treatments');
const Database = require('better-sqlite3');
const config = require('config');
const db = new Database(config.get('data.treatments'));
const Utils = require('../utils');

const uri = config.get('uri.zenodeo') + '/v2';

const fs = require('fs');
const treatmentStatus = require('../lib/treatmentsStatus');

String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
        return typeof args[number] != 'undefined' ? args[number] : match;
    });
};

const _plugin = 'treatments2';
const _resource = 'treatments';  // impt: lowercase, because used in URI
const _resourceId = 'treatmentId';
const _select = {
    none: {
        count: 'SELECT Count(*) AS numOfRecords FROM treatments',

        stats: {
            'treatments by numbers': [
                'SELECT Count(*) AS treatments FROM treatments',
                
                'SELECT Sum(specimenCount) AS specimens FROM materialsCitations m JOIN treatments t ON m.treatmentId = t.treatmentId WHERE specimenCount != ""',
                
                'SELECT Sum(specimenCountMale) AS "male specimens" FROM materialsCitations m JOIN treatments t ON m.treatmentId = t.treatmentId WHERE specimenCountMale != ""',
                
                'SELECT Sum(specimenCountFemale) AS "female specimens" FROM materialsCitations m JOIN treatments t ON m.treatmentId = t.treatmentId WHERE specimenCountFemale != ""',
                
                'SELECT Count(DISTINCT t.treatmentId) AS "treatments with specimens" FROM materialsCitations m JOIN treatments t ON m.treatmentId = t.treatmentId  WHERE specimenCount != ""',
                
                'SELECT Count(DISTINCT t.treatmentId) AS "treatments with male specimens" FROM materialsCitations m JOIN treatments t ON m.treatmentId = t.treatmentId WHERE specimenCountMale != ""',
                
                'SELECT Count(DISTINCT t.treatmentId) AS "treatments with female specimens" FROM materialsCitations m JOIN treatments t ON m.treatmentId = t.treatmentId WHERE specimenCountFemale != ""',
                
                'SELECT Count(*) AS "figure citations" FROM figureCitations f JOIN treatments t ON f.treatmentId = t.treatmentId'
            ]
        }
    },
    one: {
        data: 'SELECT treatmentId, treatmentTitle, pages, doi, zenodoDep, publicationDate, journalTitle, journalYear, journalVolume, journalIssue, authorityName, authorityYear, kingdom, phylum, "order", family, genus, species, status, rank, fullText FROM treatments WHERE treatmentId = @treatmentId',
        
        related: {
            treatmentAuthors: 'SELECT treatmentAuthorId, treatmentAuthor AS author FROM treatmentAuthors WHERE treatmentId = @treatmentId',
            
            bibRefCitations: 'SELECT bibRefCitationId, refString AS citation FROM bibRefCitations WHERE treatmentId = @treatmentId',
            
            materialsCitations: "SELECT materialsCitationId, treatmentId, typeStatus, latitude, longitude FROM materialsCitations WHERE latitude != '' AND longitude != '' AND treatmentId = @treatmentId",
            
            figureCitations: 'SELECT figureCitationId, captionText, httpUri, thumbnailUri FROM figureCitations WHERE treatmentId = @treatmentId'
        }
    },
    many: {
        q: {
            count: 'SELECT Count(treatmentId) AS numOfRecords FROM vtreatments WHERE vtreatments MATCH @q',
            
            //data: 'SELECT t.id, t.treatmentId, t.treatmentTitle, snippet(vtreatments, 1, "<b>", "</b>", "", 50) AS context FROM treatments t JOIN vtreatments v ON t.treatmentId = v.treatmentId WHERE vtreatments MATCH @q AND t.id > @id ORDER BY t.id ASC  LIMIT @limit',

            data: 'SELECT t.id, t.treatmentId, t.treatmentTitle, snippet(vtreatments, 1, "<b>", "</b>", "", 50) AS context FROM treatments t JOIN vtreatments v ON t.treatmentId = v.treatmentId WHERE vtreatments MATCH @q LIMIT @limit OFFSET @offset',
            
            stats: {
                'treatments by numbers': [
                    'SELECT Count(*) AS treatments FROM treatments t JOIN vtreatments v ON t.treatmentId = v.treatmentId WHERE vtreatments MATCH @q',
                    
                    'SELECT Sum(specimenCount) AS specimens FROM materialsCitations m JOIN treatments t ON m.treatmentId = t.treatmentId JOIN vtreatments v ON t.treatmentId = v.treatmentId WHERE vtreatments MATCH @q',
                    
                    'SELECT Sum(specimenCountMale) AS "male specimens" FROM materialsCitations m JOIN treatments t ON m.treatmentId = t.treatmentId JOIN vtreatments v ON t.treatmentId = v.treatmentId WHERE vtreatments MATCH @q',
                    
                    'SELECT Sum(specimenCountFemale) AS "female specimens" FROM materialsCitations m JOIN treatments t ON m.treatmentId = t.treatmentId JOIN vtreatments v ON t.treatmentId = v.treatmentId WHERE vtreatments MATCH @q',
                    
                    'SELECT Count(DISTINCT t.treatmentId) AS "treatments with specimens" FROM materialsCitations m JOIN treatments t ON m.treatmentId = t.treatmentId JOIN vtreatments v ON t.treatmentId = v.treatmentId WHERE specimenCount != "" AND vtreatments MATCH @q',
                    
                    'SELECT Count(DISTINCT t.treatmentId) AS "treatments with male specimens" FROM materialsCitations m JOIN treatments t ON m.treatmentId = t.treatmentId JOIN vtreatments v ON t.treatmentId = v.treatmentId WHERE specimenCountMale != "" AND vtreatments MATCH @q',
                    
                    'SELECT Count(DISTINCT t.treatmentId) AS "treatments with female specimens" FROM materialsCitations m JOIN treatments t ON m.treatmentId = t.treatmentId JOIN vtreatments v ON t.treatmentId = v.treatmentId WHERE specimenCountFemale != "" AND vtreatments MATCH @q',
                    
                    'SELECT Count(*) AS "figure citations" FROM figureCitations f JOIN vtreatments v ON f.treatmentId = v.treatmentId WHERE vtreatments MATCH @q'
                ]
            }
        },

        location: {
            count: 'SELECT Count(t.treatmentId) AS numOfRecords FROM treatments t JOIN materialsCitations m ON t.treatmentId = m.treatmentId WHERE latitude > @min_latitude AND latitude < @max_latitude AND longitude > @min_longitude AND longitude < @max_longitude',

            //data: 'SELECT t.id, t.treatmentId, t.treatmentTitle, authorityName || ". " || authorityYear || ". <i>" || articleTitle || ".</i> " || journalTitle || ", " || journalYear || ", pp. " || pages || ", vol. " || journalVolume || ", issue " || journalIssue AS context FROM treatments t JOIN materialsCitations m ON t.treatmentId = m.treatmentId WHERE latitude > @min_latitude AND latitude < @max_latitude AND longitude > @min_longitude AND longitude < @max_longitude AND t.id > @id ORDER BY t.id ASC LIMIT @limit',

            data: 'SELECT t.id, t.treatmentId, t.treatmentTitle, authorityName || ". " || authorityYear || ". <i>" || articleTitle || ".</i> " || journalTitle || ", " || journalYear || ", pp. " || pages || ", vol. " || journalVolume || ", issue " || journalIssue AS context FROM treatments t JOIN materialsCitations m ON t.treatmentId = m.treatmentId WHERE latitude > @min_latitude AND latitude < @max_latitude AND longitude > @min_longitude AND longitude < @max_longitude LIMIT @limit OFFSET @offset',

            stats: {
                'treatments by numbers': [
                    'SELECT Count(*) AS treatments FROM treatments t JOIN materialsCitations m ON t.treatmentId = m.treatmentId WHERE latitude > @min_latitude AND latitude < @max_latitude AND longitude > @min_longitude AND longitude < @max_longitude',
                    
                    'SELECT Sum(specimenCount) AS specimens FROM treatments t JOIN materialsCitations m ON t.treatmentId = m.treatmentId WHERE latitude > @min_latitude AND latitude < @max_latitude AND longitude > @min_longitude AND longitude < @max_longitude',
                    
                    'SELECT Sum(specimenCountMale) AS "male specimens" FROM treatments t JOIN materialsCitations m ON t.treatmentId = m.treatmentId WHERE latitude > @min_latitude AND latitude < @max_latitude AND longitude > @min_longitude AND longitude < @max_longitude',
                    
                    'SELECT Sum(specimenCountFemale) AS "female specimens" FROM treatments t JOIN materialsCitations m ON t.treatmentId = m.treatmentId WHERE latitude > @min_latitude AND latitude < @max_latitude AND longitude > @min_longitude AND longitude < @max_longitude',
                    
                    'SELECT Count(DISTINCT t.treatmentId) AS "treatments with specimens" FROM treatments t JOIN materialsCitations m ON t.treatmentId = m.treatmentId WHERE specimenCount != "" AND latitude > @min_latitude AND latitude < @max_latitude AND longitude > @min_longitude AND longitude < @max_longitude',
                    
                    'SELECT Count(DISTINCT t.treatmentId) AS "treatments with male specimens" FROM treatments t JOIN materialsCitations m ON t.treatmentId = m.treatmentId WHERE specimenCountMale != "" AND latitude > @min_latitude AND latitude < @max_latitude AND longitude > @min_longitude AND longitude < @max_longitude',
                    
                    'SELECT Count(DISTINCT t.treatmentId) AS "treatments with female specimens" FROM treatments t JOIN materialsCitations m ON t.treatmentId = m.treatmentId WHERE specimenCountFemale != "" AND latitude > @min_latitude AND latitude < @max_latitude AND longitude > @min_longitude AND longitude < @max_longitude',
                    
                    'SELECT Count(*) AS "figure citations" FROM figureCitations f JOIN treatments t ON f.treatmentId = t.treatmentId JOIN materialsCitations m ON t.treatmentId = m.treatmentId WHERE latitude > @min_latitude AND latitude < @max_latitude AND longitude > @min_longitude AND longitude < @max_longitude'
                ]
            }
        },

        other: {
            count: 'SELECT Count(*) AS numOfRecords FROM treatments t JOIN materialsCitations m ON t.treatmentId = m.treatmentId WHERE {0}',

            //data: 'SELECT t.id, t.treatmentId, t.treatmentTitle, authorityName || ". " || authorityYear || ". <i>" || articleTitle || ".</i> " || journalTitle || ", " || journalYear || ", pp. " || pages || ", vol. " || journalVolume || ", issue " || journalIssue AS context FROM treatments t JOIN materialsCitations m ON t.treatmentId = m.treatmentId WHERE {0} AND t.id > @id ORDER BY t.id ASC LIMIT @limit',

            data: 'SELECT t.id, t.treatmentId, t.treatmentTitle, authorityName || ". " || authorityYear || ". <i>" || articleTitle || ".</i> " || journalTitle || ", " || journalYear || ", pp. " || pages || ", vol. " || journalVolume || ", issue " || journalIssue AS context FROM treatments t JOIN materialsCitations m ON t.treatmentId = m.treatmentId WHERE {0} LIMIT @limit OFFSET @offset',

            stats: {
                'treatments by numbers': [
                    'SELECT Count(*) AS treatments FROM treatments t JOIN materialsCitations m ON t.treatmentId = m.treatmentId WHERE {0}',
                    
                    'SELECT Sum(specimenCount) AS specimens FROM materialsCitations m JOIN treatments t ON m.treatmentId = t.treatmentId WHERE {0}',
                    
                    'SELECT Sum(specimenCountMale) AS "male specimens" FROM materialsCitations m JOIN treatments t ON m.treatmentId = t.treatmentId WHERE {0}',
                    
                    'SELECT Sum(specimenCountFemale) AS "female specimens" FROM materialsCitations m JOIN treatments t ON m.treatmentId = t.treatmentId WHERE {0}',
                    
                    'SELECT Count(DISTINCT t.treatmentId) AS "treatments with specimens" FROM materialsCitations m JOIN treatments t ON m.treatmentId = t.treatmentId WHERE {0}',
                    
                    'SELECT Count(DISTINCT t.treatmentId) AS "treatments with male specimens" FROM materialsCitations m JOIN treatments t ON m.treatmentId = t.treatmentId WHERE {0}',
                    
                    'SELECT Count(DISTINCT t.treatmentId) AS "treatments with female specimens" FROM materialsCitations m JOIN treatments t ON m.treatmentId = t.treatmentId WHERE {0}',
                    
                    'SELECT Count(*) AS "figure citations" FROM figureCitations f JOIN treatments t ON f.treatmentId = t.treatmentId WHERE {0}'
                ]
            }
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
                    description: "Retrieve treatments",
                    tags: ['treatments', 'api'],
                    plugins: {
                        'hapi-swagger': {
                            order: 3,
                            responseMessages: ResponseMessages
                        }
                    },
                    //validate: Schema.treatments,
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
    preprocess(request, h);
    
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
        const data = {};
        try {
            data['num-of-records'] = db.prepare(_select.none.count)
                .get()
                .numOfRecords;
        }
        catch (error) {
            console.log(error);
        }

        data.statistics = Utils.calcStats({stats: _select.none.stats});

        return data;
    }

     // A resourceId is present. The query is for a specific
    // record. All other query params are ignored
    else if (queryObject[_resourceId]) {
        return getOneRecord(queryObject);
    }

    else if (queryObject.map) {
        return getAllRecords();
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

    // more data from beyond the database
    const resourceId = queryObject[_resourceId];
    data.xml = getXml(resourceId);
    data.taxonStats = getTaxonStats(data);

    data['related-records'] = getRelatedRecords(queryObject);
    return data
};

const getManyRecords = function(queryObject) {
    const data = {};
    let selectCount;
    let selectData;
    let selectStats;

    // if 'q' then a full text search
    if (queryObject.q) {
        selectCount = _select.many.q.count;
        selectData = _select.many.q.data;
        selectStats = _select.many.q.stats;
    }

    // everything else
    else {

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
        selectCount = _select.many.other.count.format(where);
        selectData = _select.many.other.data.format(where);
        selectStats = {};
        for (let chart in _select.many.other.stats) {
            selectStats[chart] = _select.many.other.stats[chart].map(s => s.format(where))
        }
        
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
    const page = queryObject.page ? parseInt(queryObject.page) : 1;
    const offset = (page - 1) * 30;
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
            queryString: Object.entries({treatmentId: rec.treatmentId})
                .map(e => e[0] + '=' + e[1])
                .sort()
                .join('&')
        });
    })

    // set some records-specific from and to for the formatted
    // search criteria string
    data.from = ((page - 1) * 30) + 1;
    data.to = data.records.length < limit ? 
        data.from + data.records.length - 1 : 
        data.from + limit - 1;

    data.previd = id;

    const lastrec = data.records[data.records.length - 1];
    data.nextid = lastrec.id;

    data.prevpage = page >= 1 ? page - 1 : '';
    data.nextpage = data.records.length < limit ? '' : parseInt(page) + 1;

    return data;
};

const getAllRecords = function() {
    const data = {};
    const select = 'SELECT t.treatmentId, t.treatmentTitle, authorityName || ". " || authorityYear || ". <i>" || articleTitle || ".</i> " || journalTitle || ", " || journalYear || ", pp. " || pages || ", vol. " || journalVolume || ", issue " || journalIssue AS context, m.latitude, m.longitude FROM treatments t JOIN materialsCitations m ON t.treatmentId = m.treatmentId LIMIT 100';

    try {
        data.records = db.prepare(select).all();
    }
    catch (error) {
        console.log(error);
    }

    return data;
};

// end boiler plate ******************************/

const preprocess = function(request, h) {
    if (request.query.format && request.query.format === 'xml') {
        const xml = getXml(request.query.treatmentId);
        return h.response(xml)
            .type('text/xml')
            .header('Content-Type', 'application/xml');
    }
};

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

    return rr;
};

const getTaxonStats = function(data) {
    const taxonStats = {
        kingdom: { 
            qryObj: {
                kingdom: data.kingdom
            },
            num: 0
        },
        phylum: {
            qryObj: {
                kingdom: data.kingdom,
                phylum: data.phylum
            },
            num: 0,
        },
        order: {
            qryObj: {
                kingdom: data.kingdom,
                phylum: data.phylum,
                order: data.order
            },
            num: 0
        },
        family: {
            qryObj: {
                kingdom: data.kingdom,
                phylum: data.phylum,
                order: data.order,
                family: data.family
            },
            num: 0
        },
        genus: {
            qryObj: {
                kingdom: data.kingdom,
                phylum: data.phylum,
                order: data.order,
                family: data.family,
                genus: data.genus
            },
            num: 0
        },
        species: {
            qryObj: {
                kingdom: data.kingdom,
                phylum: data.phylum,
                order: data.order,
                family: data.family,
                genus: data.genus,
                species: data.species
            },
            num: 0
        }
    };

    for (let t in taxonStats) {
        taxonStats[t].num = calcTaxonStats(taxonStats[t].qryObj);
    }

    return taxonStats;
};

const calcTaxonStats = function(taxon) {

    let cols = [];
    let vals = [];

    for (let col in taxon) {

        vals.push( taxon[col] )

        // we add double quotes to 'order' otherwise the sql statement would 
        // choke since order is a reserved word
        if (col === 'order') col = '"order"';
        cols.push(col + ' = ?');

    }

    const select = `SELECT Count(*) AS num FROM treatments WHERE ${cols.join(' AND ')}`;
    
    try {
        return db.prepare(select).get(vals);
    } 
    catch (error) {
        console.log(error);
    }
    
};

const getXml = function(treatmentId) {
    const one = treatmentId.substr(0, 1);
    const two = treatmentId.substr(0, 2);
    const thr = treatmentId.substr(0, 3);

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