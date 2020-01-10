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
        related: {},

        // stats over all the records
        stats: {
            'treatments': 'SELECT Count(treatmentId) AS numOfRecords FROM treatments WHERE deleted = 0', 

            'specimens': "SELECT  Sum(specimenCount) FROM materialsCitations m JOIN treatments t ON m.treatmentId = t.treatmentId WHERE t.deleted = 0 AND  m.deleted = 0 AND specimenCount != ''", 

            'male specimens': "SELECT  Sum(specimenCountMale) FROM materialsCitations m JOIN treatments t ON m.treatmentId = t.treatmentId WHERE t.deleted = 0 AND m.deleted = 0 AND specimenCountMale != ''", 

            'female specimens': "SELECT Sum(specimenCountFemale) FROM materialsCitations m JOIN treatments t ON m.treatmentId = t.treatmentId WHERE t.deleted = 0 AND m.deleted = 0 AND specimenCountFemale != ''", 

            'treatments with specimens': "SELECT Count(DISTINCT t.treatmentId) FROM   materialsCitations m JOIN treatments t ON m.treatmentId = t.treatmentId  WHERE t.deleted = 0 AND m.deleted = 0 AND specimenCount != ''", 

            'treatments with male specimens': "SELECT Count(DISTINCT t.treatmentId) FROM materialsCitations m JOIN treatments t ON m.treatmentId = t.treatmentId WHERE t.deleted = 0 AND m.deleted = 0 AND specimenCountMale != ''", 

            'treatments with female specimens': "SELECT Count(DISTINCT t.treatmentId) FROM materialsCitations m JOIN treatments t ON m.treatmentId = t.treatmentId WHERE t.deleted = 0 AND m.deleted = 0 AND specimenCountFemale != ''", 

            'figure citations': "SELECT Count(figureCitationId) FROM figureCitations f JOIN treatments t ON f.treatmentId = t.treatmentId WHERE t.deleted = 0 AND f.deleted = 0"
        },
    
        facets: {
            journalVolume: "SELECT journalVolume, Count(journalVolume) AS c FROM treatments WHERE deleted = 0 AND journalVolume != '' GROUP BY journalVolume",

            journalTitle: "SELECT journalTitle, Count(journalTitle) AS c FROM treatments WHERE deleted = 0 AND journalTitle != '' GROUP BY journalTitle",

            journalYear: "SELECT journalYear, Count(journalYear) AS c FROM treatments WHERE deleted = 0 AND journalYear != '' GROUP BY journalYear",

            kingdom: "SELECT kingdom, Count(kingdom) AS c FROM treatments WHERE deleted = 0 AND kingdom != '' GROUP BY kingdom",

            phylum: "SELECT phylum, Count(phylum) AS c FROM treatments WHERE deleted = 0 AND phylum != '' GROUP BY phylum",

            order: "SELECT \"order\", Count(\"order\") AS c FROM treatments WHERE deleted = 0 AND \"order\" != '' GROUP BY \"order\"",

            family: "SELECT family, Count(family) AS c FROM treatments WHERE deleted = 0 AND family != '' GROUP BY family",

            genus: "SELECT genus, Count(genus) AS c FROM treatments WHERE deleted = 0 AND genus != '' GROUP BY genus",

            status: "SELECT status, Count(status) AS c FROM treatments WHERE deleted = 0 AND status != '' GROUP BY status",

            rank: "SELECT rank, Count(rank) AS c FROM treatments WHERE deleted = 0 AND rank != '' GROUP BY rank",

            species: "SELECT species, Count(species) AS c FROM treatments WHERE deleted = 0 AND species != '' GROUP BY species",

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
    }

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

    // these params are not used in the query
    const exclude = ['page', 'size'];

    // these are the coluns on which we can sort
    const sortable = ['journalYear'];

    // the default sort column and sortdir
    let sort = 'treatmentId';
    let sortdir = 'ASC';

    let noParams = true;
    let stats = false;
    let facets = false;

    const snippet = 'snippet(vtreatments, 1, "<b>", "</b>", "", 50) AS context';

    const manyQueries = {

        count: 'Count(treatments.treatmentId) AS numOfRecords',

        columns: ['treatments.id', 'treatments.treatmentId', 'treatmentTitle', 'doi AS articleDoi', 'zenodoDep', 'zoobank', 'articleTitle', 'publicationDate', 'journalTitle', 'journalYear', 'journalVolume', 'journalIssue', 'pages', 'authorityName', 'authorityYear', 'kingdom', 'phylum', '"order"', 'family', 'genus', 'species', 'status', 'taxonomicNameLabel', 'treatments.rank'],

        from: ['treatments'],

        where: ['treatments.deleted = 0'],

        facets: config.get('v2.facets'),

        stats: {
            'treatments': {
                column: 'Count(treatments.treatmentId)', 
                from: ['treatments'],
                where: ['treatments.deleted = 0'],
                sel: ''
            },

            'specimens': {
                column: 'Sum(specimenCount)', 
                from: ['materialsCitations JOIN treatments ON materialsCitations.treatmentId = treatments.treatmentId'],
                where: ["treatments.deleted = 0 AND materialsCitations.deleted = 0 AND specimenCount != ''"],
                sel: ''
            },

            'male specimens': {
                column: 'Sum(specimenCountMale)', 
                from: ['materialsCitations JOIN treatments ON materialsCitations.treatmentId = treatments.treatmentId'],
                where: ["treatments.deleted = 0 AND materialsCitations.deleted = 0 AND specimenCountMale != ''"],
                sel: ''
            },

            'female specimens': {
                column: 'Sum(specimenCountFemale)', 
                from: ['materialsCitations JOIN treatments ON materialsCitations.treatmentId = treatments.treatmentId'],
                where: ["treatments.deleted = 0 AND materialsCitations.deleted = 0 AND specimenCountFemale != ''"],
                sel: ''
            },

            'treatments with specimens': {
                column: 'Count(DISTINCT treatments.treatmentId)', 
                from: ['materialsCitations JOIN treatments ON materialsCitations.treatmentId = treatments.treatmentId'],
                where: ["treatments.deleted = 0 AND materialsCitations.deleted = 0 AND specimenCount != ''"],
                sel: ''
            },

            'treatments with male specimens': {
                column: 'Count(DISTINCT treatments.treatmentId)', 
                from: ['materialsCitations JOIN treatments ON materialsCitations.treatmentId = treatments.treatmentId'],
                where: ["treatments.deleted = 0 AND materialsCitations.deleted = 0 AND specimenCountMale != ''"],
                sel: ''
            },

            'treatments with female specimens': {
                column: 'Count(DISTINCT treatments.treatmentId)', 
                from: ['materialsCitations JOIN treatments ON materialsCitations.treatmentId = treatments.treatmentId'],
                where: ["treatments.deleted = 0 AND materialsCitations.deleted = 0 AND specimenCountFemale != ''"],
                sel: ''
            },

            'figure citations': {
                column: 'Count(figureCitationId)', 
                from: ['figureCitations JOIN treatments ON figureCitations.treatmentId = treatments.treatmentId'],
                where: ["treatments.deleted = 0 AND figureCitations.deleted = 0"],
                sel: ''
            }

        }

    }

    for (let param in queryObject) {
        if (param === 'sortBy') {
            [sort, sortdir] = queryObject[param].split(':');
            sortdir = sortdir.toUpperCase();

            if (!sortable.includes(sort)) {
                sort = 'treatmentId';
            }

            if (sortdir !== 'ASC' && sortdir !== 'DESC') {
                sortdir = 'ASC';
            }
            
        }
        else if (param === 'stats') {
            if (queryObject.stats === 'true') {
                stats = true;
            } 
        }
        else if (param === 'facets') {
            if (queryObject.facets === 'true') {
                facets = true;
            } 
        }
        else {
            if (!exclude.includes(param)) {
                noParams = false;

                debug(`adding WHERE for "${param} = ${queryObject[param]}"`);

                if (param === 'q') {
                    
                    manyQueries.columns.push(snippet);

                    manyQueries.from.push('JOIN vtreatments ON treatments.treatmentId = vtreatments.treatmentId');

                    manyQueries.where.push('vtreatments MATCH @q');

                    if (sort === 'treatmentId') {
                        sort = 'treatments.treatmentId';
                    }

                    for (let stat in manyQueries.stats) {

                        manyQueries.stats[stat].from.push('JOIN vtreatments ON treatments.treatmentId = vtreatments.treatmentId');

                        manyQueries.stats[stat].where.push('vtreatments MATCH @q');
                        
                    }
                    
                }
                else {
                    
                    if (param === 'order') {
                        manyQueries.where.push('"order" = @order');
                    }
                    else {
                        manyQueries.where.push(`${param} = @${param}`);
                    }

                    for (let stat in manyQueries.stats) {

                        if (param === 'order') {
                            manyQueries.stats[stat].where.push('"order" = @order');
                        }
                        else {
                            manyQueries.stats[stat].where.push(`${param} = @${param}`);
                        }
                        
                    }

                }
            }
        }
    }

    const data = {};
    const queries = {
        selcount: '',
        seldata: '',
        selrelated: '',
        selstats: '',
        selfacets: ''
    }

    if (noParams) {
        
        queries.selcount = _queries.none.count;
        queries.seldata = _queries.none.data.format(sort, sortdir);

        if (stats) {
            queries.selstats = _queries.none.stats;
        }
        
        if (facets) {
            queries.selfacets = _queries.none.facets;
        }
        
    }
    else {

        queries.selcount = `SELECT ${manyQueries.count} FROM ${manyQueries.from.join(' ')} WHERE ${manyQueries.where.join(' AND ')}`;

        queries.seldata = `SELECT ${manyQueries.columns.join(', ')} FROM ${manyQueries.from.join(' ')} WHERE ${manyQueries.where.join(' AND ')} ORDER BY ${sort} ${sortdir} LIMIT @limit OFFSET @offset`;

        if (stats) {

            queries.selstats = {};
            for (let stat in manyQueries.stats) {
                queries.selstats[stat] = `SELECT ${manyQueries.stats[stat].column} FROM ${manyQueries.stats[stat].from.join(' ')} AND ${manyQueries.stats[stat].where.join(' AND ')}`;
            }
            
        }
        
        if (facets) {
            queries.selfacets = {};

            manyQueries.facets.forEach(facet => {

                if (facet === 'collectionCode') {
                    manyQueries.from.push('JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId');

                    queries.selfacets.collectionCode = `SELECT ${facet}, Count(${facet}) AS c FROM ${manyQueries.from.join(' ')} WHERE ${manyQueries.where.join(' AND ')} AND materialsCitations.deleted = 0 AND ${facet} != '' GROUP BY ${facet}`;
                }
                else {
                    queries.selfacets[facet] = `SELECT ${facet}, Count(${facet}) AS c FROM ${manyQueries.from.join(' ')} WHERE ${manyQueries.where.join(' AND ')} AND ${facet} != '' GROUP BY ${facet}`;
                }
        
            });
        }
        
    }

    // first find total number of matches
    try {
        debug(`selcount: ${queries.selcount}`);
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
    data.facets = {};
    if (queries.selfacets) {
        for (let q in queries.selfacets) {
            try {
                debug(`${q}: ${queries.selfacets[q]}`);
                data.facets[q] = db.prepare(queries.selfacets[q]).all(queryObject);
            }
            catch (error) {
                console.log(error);
            }
        }
    }

    data.stats = {};
    if (queries.selstats) {
        for (let q in queries.selstats) {
            try {
                debug(`${q}: ${queries.selstats[q]}`);
                data.stats[q] = db.prepare(queries.selstats[q]).all(queryObject);
            }
            catch (error) {
                console.log(error);
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
        debug(`seldata: ${queries.seldata}`);
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