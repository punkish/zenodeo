const Schema = require('../schema.js');
const ResponseMessages = require('../../responseMessages');
const Database = require('better-sqlite3');
const config = require('config');
const db = new Database(config.get('data.treatments'));
const fs = require('fs');
const Utils = require('../utils');

module.exports = {

    plugin: {
        name: 'treatments2',
        register: function(server, options) {

            const treatmentsCache = server.cache({
                cache: options.cacheName,
                expiresIn: options.expiresIn,
                generateTimeout: options.generateTimeout,
                segment: 'treatments2', 
                generateFunc: async (query) => { return await getTreatments(query) },
                getDecoratedValue: options.getDecoratedValue
            });

            // binds treatmentsCache to every route registered  
            // **within this plugin** after this line
            server.bind({ treatmentsCache });

            server.route([
                { 
                    path: '/treatments', 
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
                            'A taxonomic treatment.',
                        ]
                    },
                    handler 
                }
            ]);
        },
    },
};

const getStats = function(taxon) {

    let cols = [];
    let vals = [];

    for (let col in taxon) {

        vals.push( taxon[col] )

        // we add double quotes to 'order' otherwise the 
        // sql statement would choke since order is a  
        // reserved word
        if (col === 'order') col = '"order"';
        cols.push(col + ' = ?');

    }

    const select = `SELECT Count(*) AS num FROM treatments WHERE ${cols.join(' AND ')}`;
    //console.log(select);
    return db.prepare(select).get(vals)

    
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

const getOneTreatment = async function(qryObj) {
    
    const xml = getXml(qryObj.treatmentId);
    // if (qryObj.format === 'xml') {
    //     return xml;
    // }
    // else {
        let selectTreatments = 'SELECT * FROM treatments WHERE treatmentId = ?';
        let data = db.prepare(selectTreatments).get(qryObj.treatmentId);

        const selectMaterialCitations = "SELECT treatmentId, typeStatus, latitude, longitude FROM materialsCitations WHERE latitude != '' AND longitude != '' AND treatmentId = ?";

        const mcData = db.prepare(selectMaterialCitations).all(qryObj.treatmentId);

        if (mcData.length) {
            data.materialsCitations = mcData
        }

        data.images = await Utils.getImages(qryObj.treatmentId);
        data.xml = xml;

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
            taxonStats[t].num = getStats(taxonStats[t].qryObj);
        }

        data.taxonStats = taxonStats;
        
        return data
    //}
};

const getTreatments = async function(queryStr) {

    qryObj = {};
    queryStr.split('&').forEach(el => { a = el.split('='); qryObj[ a[0] ] = a[1]; });

    const calcLimits = function(id = 0) {
        return [id, id * 30];
    };
    
    if (qryObj.count) {
        return db.prepare('SELECT Count(*) AS count FROM treatments').get();
    }

    // There are three kinds of possible queries for treatments
    //
    // 1. A 'treatmentId' is present. The query is for a specific
    // treatment. All other query params are ignored

    let where;
    let query;
    let id;
    let offset;
    let selectCount;
    let select;

    if (qryObj.treatmentId) {
        return await getOneTreatment(qryObj);
    }

    // 2. The param 'q' is present. The query is a fullText query.
    // There could be other optional params to narrow the result.
    else if (qryObj.q) {

        where = 'vtreatments MATCH ?';
        query = [qryObj.q];

        [id, offset] = calcLimits(qryObj.id ? parseInt(qryObj.id) : 0);

        selectCount = `
        SELECT      Count(id) c 
        FROM        treatments t JOIN vtreatments v ON t.treatmentId = v.treatmentId 
        WHERE       ${where}`;

        select = `
        SELECT      t.id, t.treatmentId, t.treatmentTitle, 
                    snippet(v.vtreatments, 1, '<b>', '</b>', '', 50) s 
        FROM        treatments t JOIN vtreatments v ON t.treatmentId = v.treatmentId 
        WHERE       ${where} 
        LIMIT       30
        OFFSET      ?`;
    }

    // 3. 'lat' and 'lon' are present in the query string, so 
    // this is a location query. A location query is performed 
    // against the 'materialcitations' table
    else if (qryObj.lat && qryObj.lon) {

        where = 'latitude = ? AND longitude = ?';
        query = [qryObj.lat, qryObj.lon];
        [id, offset] = calcLimits(qryObj.id);

        selectCount = `
        SELECT      Count(id) c 
        FROM        materialsCitations 
        WHERE       ${where}`;

        select = `SELECT * FROM materialsCitations WHERE ${where} LIMIT 30 OFFSET ?`;       
    }

    // 4. Neither the 'treatmentId' nor 'q' are present. The query 
    // A standard SQL query is performed against the treatments 
    // database 
    else {

        let cols = [];
        let vals = [];

        for (let col in qryObj) {

            if (col !== 'id') {
                vals.push( qryObj[col] )

                // we add double quotes to 'order' otherwise the 
                // sql statement would choke since order is a  
                // reserved word
                if (col === 'order') col = '"order"';
                cols.push(col + ' = ?');
            }

        }

        where = cols.join(' AND ');
        query = vals;
        [id, offset] = calcLimits(qryObj.id);

        selectCount = `
        SELECT      Count(id) c 
        FROM        treatments 
        WHERE       ${where}`;

        select = `SELECT treatmentId, treatmentTitle, journalTitle || ', ' || journalYear || ', ' || pages || ', ' || journalVolume || ', ' || journalIssue AS s FROM treatments WHERE ${where} LIMIT 30 OFFSET ?`;       
    }

    const recordsFound = db.prepare(selectCount).get(query).c;

    query.push(offset);
    const records = db.prepare(select).all(query);
    const num = records.length;

    const from = (id * 30) + 1;
    let to = from + 30 - 1;
    if (num < 30) {
        to = from + num - 1;
    }
    
    let nextid = parseInt(id) + 1;
    if (num < 30) {
        nextid = '';
    }

    return {
        previd: id >= 1 ? id - 1 : '',
        nextid: nextid,
        recordsFound: recordsFound,
        from: from,
        to: to,
        treatments: records
    };
}

const handler = function(request, h) {

    if (request.query.format && request.query.format === 'xml') {
        const xml = getXml(request.query.treatmentId);;
        return h.response(xml)
            .type('text/xml')
            .header('Content-Type', 'application/xml');
    }
    else {

        // remove 'refreshCache' from the query params and make the 
        // queryString into a standard form (all params sorted) so
        // it can be used as a cachekey
        let arr = [];

        for (let k in request.query) {
            if (k !== 'refreshCache') {
                arr.push(k + '=' + request.query[k])
            }
        }

        const query = arr.sort().join('&');

        if (request.query.refreshCache === 'true') {
            console.log('forcing refreshCache')
            this.treatmentsCache.drop(query);
        }

        return this.treatmentsCache.get(query);
    }
};
