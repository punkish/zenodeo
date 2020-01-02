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

String.prototype.format = function() {
    const args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
        return typeof args[number] != 'undefined' ? args[number] : match;
    });
};

const _queries = {

    /*
    The following columns are not part of the 'treatments' table. They are related records for every treatment
    - treatmentAuthors
    - materialsCitations
    - figureCitations

    I don't have 'treatmentCitations'.

    That leaves only 'journalYear' from what you asked for.

    Remember, I can only sort by the columns in my table. The columns are 
    - treatmentTitle
    - articleDoi
    - zenodoDep
    - zoobank
    - articleTitle
    - publicationDate
    - journalTitle
    - journalYear
    - journalVolume
    - journalIssue
    - pages
    - authorityName
    - authorityYear
    - kingdom
    - phylum
    - order
    - family
    - genus
    - species
    - status
    - taxonomicNameLabel
    - rank

    Thought sorting by many of the above may not make sense.

    The default sort is by 'treatmentId' with sort order ASC
*/

    // no parameters
    none: {

        // total number of records in the table
        count: 'SELECT Count(treatmentId) AS numOfRecords FROM treatments WHERE deleted = 0',

        // the first page (OFFSET 1) of 30 records (LIMIT 30)
        data:  'SELECT id, treatmentId, treatmentTitle, doi AS articleDoi, zenodoDep, zoobank, articleTitle, publicationDate, journalTitle, journalYear, journalVolume, journalIssue, pages, authorityName, authorityYear, kingdom, phylum, "order", family, genus, species, status, taxonomicNameLabel, rank FROM treatments WHERE deleted = 0 ORDER BY {0} {1} LIMIT @limit OFFSET @offset',

        // related records: there are no related records since many treatments are being returned
        // related records are returned only for a single treatment
        //related: {},

        // stats over all the records
        stats: {
            'treatments by numbers': {
                                        treatments: 'SELECT Count(treatmentId) FROM treatments WHERE deleted = 0',
                
                                         specimens: `SELECT  Sum(specimenCount)  
                                                     FROM    materialsCitations m JOIN treatments t ON m.treatmentId = t.treatmentId 
                                                     WHERE   m.deleted = 0 AND specimenCount != ""`,
                
                                  'male specimens': `SELECT  Sum(specimenCountMale) 
                                                     FROM    materialsCitations m JOIN treatments t ON m.treatmentId = t.treatmentId 
                                                     WHERE   m.deleted = 0 AND specimenCountMale != ""`,
                
                                'female specimens': `SELECT Sum(specimenCountFemale) 
                                                     FROM   materialsCitations m JOIN treatments t ON m.treatmentId = t.treatmentId 
                                                     WHERE  m.deleted = 0 AND specimenCountFemale != ""`,
                
                       'treatments with specimens': `SELECT Count(DISTINCT t.treatmentId) 
                                                     FROM   materialsCitations m JOIN treatments t ON m.treatmentId = t.treatmentId  
                                                     WHERE  m.deleted = 0 AND specimenCount != ""`,
                
                  'treatments with male specimens': `SELECT Count(DISTINCT t.treatmentId) 
                                                     FROM   materialsCitations m JOIN treatments t ON m.treatmentId = t.treatmentId 
                                                     WHERE  m.deleted = 0 AND specimenCountMale != ""`,
                
                'treatments with female specimens': `SELECT Count(DISTINCT t.treatmentId)  
                                                     FROM   materialsCitations m JOIN treatments t ON m.treatmentId = t.treatmentId 
                                                     WHERE  m.deleted = 0 AND specimenCountFemale != ""`,
                
                                'figure citations': `SELECT Count(figureCitationId) 
                                                     FROM   figureCitations f JOIN treatments t ON f.treatmentId = t.treatmentId
                                                     WHERE  f.deleted = 0`
            }
        },
    
        facets: {
           journalVolume: "SELECT journalVolume,  Count(journalVolume)  AS c FROM treatments WHERE deleted = 0 AND journalVolume != '' GROUP BY journalVolume",
            journalTitle: "SELECT journalTitle,   Count(journalTitle)   AS c FROM treatments WHERE deleted = 0 AND journalTitle  != '' GROUP BY journalTitle",
             journalYear: "SELECT journalYear,    Count(journalYear)    AS c FROM treatments WHERE deleted = 0 AND journalYear   != '' GROUP BY journalYear",
                 kingdom: "SELECT kingdom,        Count(kingdom)        AS c FROM treatments WHERE deleted = 0 AND kingdom       != '' GROUP BY kingdom",
                  phylum: "SELECT phylum,         Count(phylum)         AS c FROM treatments WHERE deleted = 0 AND phylum        != '' GROUP BY phylum",
                   order: "SELECT \"order\",      Count(\"order\")      AS c FROM treatments WHERE deleted = 0 AND \"order\"     != '' GROUP BY \"order\"",
                  family: "SELECT family,         Count(family)         AS c FROM treatments WHERE deleted = 0 AND family        != '' GROUP BY family",
                   genus: "SELECT genus,          Count(genus)          AS c FROM treatments WHERE deleted = 0 AND genus         != '' GROUP BY genus",
                  status: "SELECT status,         Count(status)         AS c FROM treatments WHERE deleted = 0 AND status        != '' GROUP BY status",
                    rank: "SELECT rank,           Count(rank)           AS c FROM treatments WHERE deleted = 0 AND rank          != '' GROUP BY rank",
                 species: "SELECT species,        Count(species)        AS c FROM treatments WHERE deleted = 0 AND species       != '' GROUP BY species",
          collectionCode: "SELECT collectionCode, Count(collectionCode) AS c FROM materialsCitations m JOIN treatments t on m.treatmentId = t.treatmentId WHERE m.deleted = 0 AND t.deleted = 0 AND collectionCode != '' GROUP BY collectionCode"
        }
    },

    // treatmentId
    one: {

        count: 1,

        data: 'SELECT treatmentId, treatmentTitle, pages, doi AS articleDoi, zenodoDep, publicationDate, journalTitle, journalYear, journalVolume, journalIssue, authorityName, authorityYear, kingdom, phylum, "order", family, genus, species, status, rank, fullText FROM treatments WHERE deleted = 0 AND treatmentId = @treatmentId',
        
        related: {
            treatmentAuthors: 'SELECT treatmentAuthorId, treatmentAuthor AS author FROM treatmentAuthors WHERE deleted = 0 AND treatmentId = @treatmentId',
            
            bibRefCitations: 'SELECT bibRefCitationId, refString AS citation FROM bibRefCitations WHERE deleted = 0 AND treatmentId = @treatmentId',
            
            materialsCitations: "SELECT materialsCitationId, treatmentId, typeStatus, latitude, longitude FROM materialsCitations WHERE deleted = 0 AND latitude != '' AND longitude != '' AND treatmentId = @treatmentId",
            
            figureCitations: 'SELECT figureCitationId, captionText, httpUri, thumbnailUri FROM figureCitations WHERE deleted = 0 AND treatmentId = @treatmentId'
        },
        stats: {},
        facets: {}
    },

    // many: {
    //     q: {
    //         count: 'SELECT Count(treatmentId) AS numOfRecords FROM vtreatments WHERE vtreatments MATCH @q',
            
    //         //data: 'SELECT t.id, t.treatmentId, t.treatmentTitle, snippet(vtreatments, 1, "<b>", "</b>", "", 50) AS context FROM treatments t JOIN vtreatments v ON t.treatmentId = v.treatmentId WHERE vtreatments MATCH @q AND t.id > @id ORDER BY t.id ASC  LIMIT @limit',

    //         data: 'SELECT t.id, t.treatmentId, t.treatmentTitle, snippet(vtreatments, 1, "<b>", "</b>", "", 50) AS context, f.httpUri, f.captionText FROM treatments t JOIN vtreatments v ON t.treatmentId = v.treatmentId LEFT JOIN figureCitations f ON t.treatmentId = f.treatmentId WHERE vtreatments MATCH @q LIMIT @limit OFFSET @offset',
            
    //         stats: {
    //             'treatments by numbers': [
    //                 'SELECT Count(*) AS treatments FROM treatments t JOIN vtreatments v ON t.treatmentId = v.treatmentId WHERE vtreatments MATCH @q',
                    
    //                 'SELECT Sum(specimenCount) AS specimens FROM materialsCitations m JOIN treatments t ON m.treatmentId = t.treatmentId JOIN vtreatments v ON t.treatmentId = v.treatmentId WHERE vtreatments MATCH @q',
                    
    //                 'SELECT Sum(specimenCountMale) AS "male specimens" FROM materialsCitations m JOIN treatments t ON m.treatmentId = t.treatmentId JOIN vtreatments v ON t.treatmentId = v.treatmentId WHERE vtreatments MATCH @q',
                    
    //                 'SELECT Sum(specimenCountFemale) AS "female specimens" FROM materialsCitations m JOIN treatments t ON m.treatmentId = t.treatmentId JOIN vtreatments v ON t.treatmentId = v.treatmentId WHERE vtreatments MATCH @q',
                    
    //                 'SELECT Count(DISTINCT t.treatmentId) AS "treatments with specimens" FROM materialsCitations m JOIN treatments t ON m.treatmentId = t.treatmentId JOIN vtreatments v ON t.treatmentId = v.treatmentId WHERE specimenCount != "" AND vtreatments MATCH @q',
                    
    //                 'SELECT Count(DISTINCT t.treatmentId) AS "treatments with male specimens" FROM materialsCitations m JOIN treatments t ON m.treatmentId = t.treatmentId JOIN vtreatments v ON t.treatmentId = v.treatmentId WHERE specimenCountMale != "" AND vtreatments MATCH @q',
                    
    //                 'SELECT Count(DISTINCT t.treatmentId) AS "treatments with female specimens" FROM materialsCitations m JOIN treatments t ON m.treatmentId = t.treatmentId JOIN vtreatments v ON t.treatmentId = v.treatmentId WHERE specimenCountFemale != "" AND vtreatments MATCH @q',
                    
    //                 'SELECT Count(*) AS "figure citations" FROM figureCitations f JOIN vtreatments v ON f.treatmentId = v.treatmentId WHERE vtreatments MATCH @q'
    //             ]
    //         }
    //     },

    //     location: {
    //         count: 'SELECT Count(t.treatmentId) AS numOfRecords FROM treatments t JOIN materialsCitations m ON t.treatmentId = m.treatmentId WHERE latitude > @min_latitude AND latitude < @max_latitude AND longitude > @min_longitude AND longitude < @max_longitude',

    //         //data: 'SELECT t.id, t.treatmentId, t.treatmentTitle, authorityName || ". " || authorityYear || ". <i>" || articleTitle || ".</i> " || journalTitle || ", " || journalYear || ", pp. " || pages || ", vol. " || journalVolume || ", issue " || journalIssue AS context FROM treatments t JOIN materialsCitations m ON t.treatmentId = m.treatmentId WHERE latitude > @min_latitude AND latitude < @max_latitude AND longitude > @min_longitude AND longitude < @max_longitude AND t.id > @id ORDER BY t.id ASC LIMIT @limit',

    //         data: 'SELECT t.id, t.treatmentId, t.treatmentTitle, authorityName || ". " || authorityYear || ". <i>" || articleTitle || ".</i> " || journalTitle || ", " || journalYear || ", pp. " || pages || ", vol. " || journalVolume || ", issue " || journalIssue AS context FROM treatments t JOIN materialsCitations m ON t.treatmentId = m.treatmentId WHERE latitude > @min_latitude AND latitude < @max_latitude AND longitude > @min_longitude AND longitude < @max_longitude LIMIT @limit OFFSET @offset',

    //         stats: {
    //             'treatments by numbers': [
    //                 'SELECT Count(*) AS treatments FROM treatments t JOIN materialsCitations m ON t.treatmentId = m.treatmentId WHERE latitude > @min_latitude AND latitude < @max_latitude AND longitude > @min_longitude AND longitude < @max_longitude',
                    
    //                 'SELECT Sum(specimenCount) AS specimens FROM treatments t JOIN materialsCitations m ON t.treatmentId = m.treatmentId WHERE latitude > @min_latitude AND latitude < @max_latitude AND longitude > @min_longitude AND longitude < @max_longitude',
                    
    //                 'SELECT Sum(specimenCountMale) AS "male specimens" FROM treatments t JOIN materialsCitations m ON t.treatmentId = m.treatmentId WHERE latitude > @min_latitude AND latitude < @max_latitude AND longitude > @min_longitude AND longitude < @max_longitude',
                    
    //                 'SELECT Sum(specimenCountFemale) AS "female specimens" FROM treatments t JOIN materialsCitations m ON t.treatmentId = m.treatmentId WHERE latitude > @min_latitude AND latitude < @max_latitude AND longitude > @min_longitude AND longitude < @max_longitude',
                    
    //                 'SELECT Count(DISTINCT t.treatmentId) AS "treatments with specimens" FROM treatments t JOIN materialsCitations m ON t.treatmentId = m.treatmentId WHERE specimenCount != "" AND latitude > @min_latitude AND latitude < @max_latitude AND longitude > @min_longitude AND longitude < @max_longitude',
                    
    //                 'SELECT Count(DISTINCT t.treatmentId) AS "treatments with male specimens" FROM treatments t JOIN materialsCitations m ON t.treatmentId = m.treatmentId WHERE specimenCountMale != "" AND latitude > @min_latitude AND latitude < @max_latitude AND longitude > @min_longitude AND longitude < @max_longitude',
                    
    //                 'SELECT Count(DISTINCT t.treatmentId) AS "treatments with female specimens" FROM treatments t JOIN materialsCitations m ON t.treatmentId = m.treatmentId WHERE specimenCountFemale != "" AND latitude > @min_latitude AND latitude < @max_latitude AND longitude > @min_longitude AND longitude < @max_longitude',
                    
    //                 'SELECT Count(*) AS "figure citations" FROM figureCitations f JOIN treatments t ON f.treatmentId = t.treatmentId JOIN materialsCitations m ON t.treatmentId = m.treatmentId WHERE latitude > @min_latitude AND latitude < @max_latitude AND longitude > @min_longitude AND longitude < @max_longitude'
    //             ]
    //         }
    //     },

    //     other: {
    //         count: 'SELECT Count(*) AS numOfRecords FROM treatments t JOIN materialsCitations m ON t.treatmentId = m.treatmentId WHERE {0}',

    //         //data: 'SELECT t.id, t.treatmentId, t.treatmentTitle, authorityName || ". " || authorityYear || ". <i>" || articleTitle || ".</i> " || journalTitle || ", " || journalYear || ", pp. " || pages || ", vol. " || journalVolume || ", issue " || journalIssue AS context FROM treatments t JOIN materialsCitations m ON t.treatmentId = m.treatmentId WHERE {0} AND t.id > @id ORDER BY t.id ASC LIMIT @limit',

    //         data: 'SELECT t.id, t.treatmentId, t.treatmentTitle, authorityName || ". " || authorityYear || ". <i>" || articleTitle || ".</i> " || journalTitle || ", " || journalYear || ", pp. " || pages || ", vol. " || journalVolume || ", issue " || journalIssue AS context FROM treatments t JOIN materialsCitations m ON t.treatmentId = m.treatmentId WHERE {0} LIMIT @limit OFFSET @offset',

    //         stats: {
    //             'treatments by numbers': [
    //                 'SELECT Count(*) AS treatments FROM treatments t JOIN materialsCitations m ON t.treatmentId = m.treatmentId WHERE {0}',
                    
    //                 'SELECT Sum(specimenCount) AS specimens FROM materialsCitations m JOIN treatments t ON m.treatmentId = t.treatmentId WHERE {0}',
                    
    //                 'SELECT Sum(specimenCountMale) AS "male specimens" FROM materialsCitations m JOIN treatments t ON m.treatmentId = t.treatmentId WHERE {0}',
                    
    //                 'SELECT Sum(specimenCountFemale) AS "female specimens" FROM materialsCitations m JOIN treatments t ON m.treatmentId = t.treatmentId WHERE {0}',
                    
    //                 'SELECT Count(DISTINCT t.treatmentId) AS "treatments with specimens" FROM materialsCitations m JOIN treatments t ON m.treatmentId = t.treatmentId WHERE {0}',
                    
    //                 'SELECT Count(DISTINCT t.treatmentId) AS "treatments with male specimens" FROM materialsCitations m JOIN treatments t ON m.treatmentId = t.treatmentId WHERE {0}',
                    
    //                 'SELECT Count(DISTINCT t.treatmentId) AS "treatments with female specimens" FROM materialsCitations m JOIN treatments t ON m.treatmentId = t.treatmentId WHERE {0}',
                    
    //                 'SELECT Count(*) AS "figure citations" FROM figureCitations f JOIN treatments t ON f.treatmentId = t.treatmentId WHERE {0}'
    //             ]
    //         }
    //     }
    // }
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
    debug(`queryObject: ${JSON.stringify(queryObject)}`);

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

// const getStatistics = function() {
//     const data = {};

    // try {
    //     data['num-of-records'] = db.prepare(_select.none.count)
    //         .get()
    //         .numOfRecords;
    // }
    // catch (error) {
    //     console.log(error);
    // }

//     data.statistics = Utils.calcStats({stats: _select.none.stats});

//     return data;
// };

const getOneRecord = function(queryObject) {    
    let data;
    try {
        debug(`sel.one.data: ${_queries.one.data}`);
        data = db.prepare(_queries.one.data).get(queryObject) || { 'num-of-records': 0 };
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

    if (data['num-of-records']) {

        // more data from beyond the database
        data.xml = getXml(queryObject.treatmentId);
        data.taxonStats = getTaxonStats(data);
        data['related-records'] = getRelatedRecords(queryObject);
    }

    return data;
};

const getManyRecords = function(queryObject) {
    const data = {};
    
    const exclude = ['page', 'size'];
    const sortable = ['journalYear'];
    let sort = 'treatmentId';
    let sortdir = 'ASC';

    let noParams = true;

    for (let param in queryObject) {
        if (param === 'sortBy') {
            [sort, sortdir] = queryObject[param].split(':');

            if (!sortable.includes(sort)) {
                sort = 'treatmentId';
            }

            if (sortdir !== 'ASC' && sortdir !== 'DESC') {
                sortdir = 'ASC';
            }
        }
        else {
            if (!exclude.includes(param)) {
                noParams = false;
            }
        }
    }

    let selcount;
    let seldata;
    let selrelated;
    let selstats;
    let selfacets = {};

    if (noParams) {

        // total number of matches
        selcount = _queries.none.count;

        // the a page of 30 records (LIMIT 30)
        seldata = _queries.none.data.format(sort, sortdir);

        // stats
        selstats = _queries.none.stats;

        // facets
        selfacets = _queries.none.facets;

    }
    else {

        // create the queries
        const snippet = 'snippet(vtreatments, 1, "<b>", "</b>", "", 50) AS context';
        const queries = {
            count: 'Count(treatments.treatmentId) AS numOfRecords',
            columns: ['id', 'treatments.treatmentId', 'treatmentTitle', 'doi AS articleDoi', 'zenodoDep', 'zoobank', 'articleTitle', 'publicationDate', 'journalTitle', 'journalYear', 'journalVolume', 'journalIssue', 'pages', 'authorityName', 'authorityYear', 'kingdom', 'phylum', '"order"', 'family', 'genus', 'species', 'status', 'taxonomicNameLabel', 'treatments.rank'],
            facets: config.get('v2.facets'),
            from: ['treatments'],
            where: []
        }
        
        // We don't need 'page' and 'size' in the query params
        //const exclude = ['page', 'size'];

        for (let param in queryObject) {

            if (param === 'sortBy') {
                [sort, sortdir] = queryObject[param].split(':');
    
                if (!sortable.includes(sort)) {
                    sort = 'treatmentId';
                }
    
                if (sortdir !== 'ASC' && sortdir !== 'DESC') {
                    sortdir = 'ASC';
                }
            }
            else {

                if (!exclude.includes(param)) {
                    if (param === 'q') {
                        queries.columns.push(snippet);
                        queries.from.push('JOIN vtreatments ON treatments.treatmentId = vtreatments.treatmentId')
                        queries.where.push('vtreatments MATCH @q');
                    }
                    else {
                        if (param === 'order') {
                            queries.where.push('"order" = @order');
                        }
                        else {
                            queries.where.push(`${param} = @${param}`);
                        }
                    }
                }

            }
        }

        const fromwhere = `FROM ${queries.from.join(' ')} WHERE ${queries.where.join(' AND ')}`;

        queries.facets.forEach(facet => {

            // 'rank' is a reserved word in FTS tables, so using it in an FTS query 
            // throws an error. That is why we prefix the column 'rank' with the 
            // table name
            let f = facet;
            if (facet === 'treatments.rank') {
                f = 'rank';
            }

            selfacets[facet] = `SELECT ${facet}, Count(${facet}) AS c ${fromwhere} AND ${facet} != '' GROUP BY ${facet}`;
        });

        // total number of matches
        selcount = `SELECT ${queries.count} ${fromwhere}`;

        // the first page (OFFSET 1) of 30 records (LIMIT 30)
        seldata = `SELECT ${queries.columns.join(', ')} ${fromwhere} ORDER BY ${sort} ${sortdir} LIMIT @limit OFFSET @offset`;

        // no related records
        // selrelated

        // stats
        selstats = _queries.none.stats;

        // facets
        //selfacets = _queries.none.facets;
    }

    

    // first find total number of matches
    try {
        debug(`selcount: ${selcount}`);
        data['num-of-records'] = db.prepare(selcount)
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
    data.facets = {};
    for (let q in selfacets) {
        try {
            debug(`${q}: ${selfacets[q]}`);
            data.facets[q] = db.prepare(selfacets[q]).all(queryObject);
        }
        catch (error) {
            console.log(error);
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
        debug(`seldata: ${seldata}`);
        data.records = db.prepare(seldata).all(queryObject) || [];
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

const getRelatedRecords = function(queryObject) {
    const rr = {};

    const relatedRecords = _queries.one.related;
    for (let relatedResource in relatedRecords) {

        try {
            const select = relatedRecords[relatedResource];
            debug(`${relatedResource}: ${select}`);
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
            debug(select);
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