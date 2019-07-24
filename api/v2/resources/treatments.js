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

const statuses = [
    '(s. str.)',
    'COMB. NOV',
    'COMB. NOV.',
    'Comb. nov',
    'Comb. nov.',
    'GEN. NOV.',
    'Gen. Nov.',
    'N. GEN.',
    'N.COMB.',
    'NEW COMBINATION',
    'NEW GENUS',
    'NEW SP.',
    'NEW SPECIES',
    'NEW SSP.',
    'NEW STATUS',
    'New Combination',
    'New Genus',
    'New Species',
    'New Status',
    'New Subspecies',
    'New combination',
    'New genus',
    'New species',
    'New status',
    'STAT. NOV.',
    'STAT. REV.',
    'Synonym',
    'Transf. from Amaurobius',
    'com. nov.',
    'comB. nov.',
    'comb n.',
    'comb nov.',
    'comb.',
    'comb. n',
    'comb. n.',
    'comb. nov',
    'comb. nov.',
    'comb.n.',
    'comb.nov.',
    'fam. nov.',
    'gen nov. et sp. nov.',
    'gen. et comb. nov.',
    'gen. et sp. nov.',
    'gen. n',
    'gen. n.',
    'gen. nov',
    'gen. nov.',
    'gen. nov. et sp. nov.',
    'gen. nov., sp. nov.',
    'gen.n.',
    'gen.nov.',
    'genus nov.',
    'hybr. nov.',
    'incertae sedis',
    'n . comb.',
    'n . sp .',
    'n . sp.',
    'n sp.',
    'n. Comb.',
    'n. comb',
    'n. comb.',
    'n. g.',
    'n. g., n. sp.',
    'n. gen.',
    'n. gen., n. sp.',
    'n. sp .',
    'n. sp.',
    'n. ssp.',
    'n. st.',
    'n. stat.',
    'n. stat., n. comb.',
    'n. subg.',
    'n. subgen.',
    'n. subgenus',
    'n. subsp.',
    'n. v.',
    'n. var.',
    'n.comb',
    'n.comb.',
    'n.gen.',
    'n.sp.',
    'n.ssp.',
    'n.stat.',
    'new',
    'new comb',
    'new comb.',
    'new combination',
    'new gen.',
    'new genus',
    'new replacement name',
    'new sPecies',
    'new sp.',
    'new speCies',
    'new spec.',
    'new specIes',
    'new species',
    'new status',
    'new subgenus',
    'new subspecies',
    'new synonym',
    'nom. n.',
    'nom. nov.',
    'nom.nov.',
    'nomina dubia',
    'nov. comb.',
    'nov. gen.',
    'nov. sp.',
    'nov. spec.',
    'nov. ssp.',
    'nov. st.',
    'nov. subgen.',
    'nov. var.',
    'nov.sp.',
    's. str.',
    's.l.',
    's.s.',
    'sP. nov.',
    'sensu lato',
    'sensu stricto',
    'sp . n .',
    'sp . nov',
    'sp . nov .',
    'sp . nov.',
    'sp .n.',
    'sp .nov.',
    'sp.',
    'sp. and subsp. nov.',
    'sp. n',
    'sp. n.',
    'sp. noV.',
    'sp. nov',
    'sp. nov.',
    'sp.n',
    'sp.n.',
    'sp.nov',
    'sp.nov.',
    'spec.',
    'spec. n.',
    'spec. nov',
    'spec. nov.',
    'spec. nova',
    'spec.nov.',
    'species nov.',
    'ssp. n.',
    'ssp. nov',
    'ssp. nov.',
    'ssp.n.',
    'stat rev.',
    'stat. nov',
    'stat. nov.',
    'stat. rev.',
    'stat.nov.',
    'stat.rev.',
    'subfam. nov.',
    'subgen. n.',
    'subgen. nov.',
    'subsp. n.',
    'subsp. nov',
    'subsp. nov.',
    'subspec. nov.',
    'subspecies nov.',
    'syn. n.',
    'syn. nov.',
    'syn.n.',
    'synonym',
    'tranf. to Araniella',
    'tranf. to Bianor',
    'tranf. to Borboropactus',
    'tranf. to Diaea',
    'tranf. to Drassodes',
    'tranf. to Henriksenia',
    'tranf. to Lysteles',
    'tranf. to Massuria',
    'transf. from Agroeca',
    'transf. from Alaeho',
    'transf. from Phrurolithus',
    'transf. from Scotinella',
    'transf. to Corinnoma'
];

const isNewSpecies = function(status) {

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

const getMaterialsCitations = function(treatmentId) {
    const selectMaterialCitations = "SELECT treatmentId, typeStatus, latitude, longitude FROM materialsCitations WHERE latitude != '' AND longitude != '' AND treatmentId = ?";

    return db.prepare(selectMaterialCitations).all(treatmentId);
};

const getAuthors = function(treatmentId) {
    const selectAuthors = 'SELECT treatmentAuthor AS author FROM treatmentAuthors WHERE treatmentId = ?';
    const authors = db.prepare(selectAuthors).all(treatmentId);
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

    return [authors, authorsList];
};

const getCitations = function(treatmentId) {
    const selectCitations = 'SELECT refString AS citation FROM bibRefCitations WHERE treatmentId = ?';
    return db.prepare(selectCitations).all(treatmentId);
};

const getOneTreatment = async function(qryObj) {

    const treatmentId = qryObj.treatmentId;

    const xml = getXml(treatmentId);

    // let selectTreatments = 'SELECT treatmentId, treatmentTitle AS articleTitle, pages, doi, zenodoDep, publicationDate, journalTitle, journalYear, journalVolume, journalIssue, authorityName, authorityYear, kingdom, phylum, "order", family, genus, species, status, rank, fullText FROM treatments WHERE treatmentId = ?';
    let selectTreatments = 'SELECT * FROM treatments WHERE treatmentId = ?';
    let data = db.prepare(selectTreatments).get(treatmentId);
    //console.log(data)

    // construct treatmentTitleLabel
    // "Title of the treatment. If it is a new species, a taxonomicNameLabel will be present, and is concatenated to the taxonomicName, which is concatenated to the authority attribute"
    // data.treatmentTitleLabel = data.authorityName;
    // if (data.status === 'sp. nov.') {
    //     data.taxonomicNameLabel
    // }

    // genus = $('subSubSection[type=nomenclature] taxonomicName').attr('genus');
    // species = $('subSubSection[type=nomenclature] taxonomicName').attr('species');
    // authority = $('subSubSection[type=nomenclature] taxonomicName').attr('authorityName');
    // status = $('subSubSection[type=nomenclature] taxonomicName').attr('status');

    // data.treatmentTitle = `${data.genus} ${data.species}`;

    // // if the species is a new species, status will be 'sp. nov.'
    // if (data.status.toLowerCase() === 'sp. nov.') {
    //     data.treatmentTitle += ' ' + data.status;
    // }

    // data.treatmentTitle += ` ${data.authorityName} ${data.authorityYear}`;

    [data.authors, data.authorsList] = getAuthors(treatmentId);
    data.citations = getCitations(treatmentId);

    data.materialsCitations = getMaterialsCitations(treatmentId);

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
    return data;
};

const getTreatments = async function(queryStr) {

    qryObj = {};
    queryStr.split('&').forEach(el => { a = el.split('='); qryObj[ a[0] ] = a[1]; });

    const calcLimits = function(id = 0) {
        return [id, id * 30];
    };
    
    if (qryObj.count) {

        // A simple count query used to populate the search field
        return db.prepare('SELECT Count(*) AS count FROM treatments').get();
    }
    else if (qryObj.treatmentId) {

        // 1. A 'treatmentId' is present. The query is for a specific
        // treatment. All other query params are ignored
        return await getOneTreatment(qryObj);
    }
    else {

        // More complicated queries with search parameters

        let count = 'Count(id) c'; 
        // let whatCols = ['t.id', 't.treatmentId', 't.treatmentTitle'];
        // const citationCols = [
        //     't.authorityName', 
        //     't.authorityYear', 
        //     't.articleTitle', 
        //     't.journalTitle', 
        //     't.journalYear', 
        //     't.pages', 
        //     't.journalVolume', 
        //     't.journalIssue'
        // ];
        let what = 't.id, t.treatmentId, t.treatmentTitle, ';
        const citation = "t.authorityName || '. ' || t.authorityYear || '. <i>' || t.articleTitle || '.</i> ' || t.journalTitle || ', ' || t.journalYear || ', pp. ' || t.pages || ', vol. ' || t.journalVolume || ', issue ' || t.journalIssue AS s";
        let fromTables;
        let where;
        
        let limit = '30 OFFSET ?';

        let query;
        const [id, offset] = calcLimits(qryObj.id ? parseInt(qryObj.id) : 0);
        let selectCount;
        let select;

        // 1. The param 'q' is present. The query is a fullText query.
        // There could be other optional params to narrow the result.
        if (qryObj.q) {

            //whatCols.push("snippet(v.vtreatments, 1, '<b>', '</b>', '', 50) AS s");
            what       += "snippet(v.vtreatments, 1, '<b>', '</b>', '', 50) AS s";
            fromTables  = 'treatments t JOIN vtreatments v ON t.treatmentId = v.treatmentId';
            where       = 'vtreatments MATCH ?';
            query       = [qryObj.q];

        }

        // 2. 'lat' and 'lon' are present in the query string, so 
        // this is a location query. A location query is performed 
        // against the 'materialcitations' table
        else if (qryObj.lat && qryObj.lon) {

            //whatCols = [...whatCols, ...citationCols];
            what       += citation;
            fromTables  = 'treatments t JOIN materialsCitations m ON t.treatmentId = m.treatmentId';
            where       = 'latitude = ? AND longitude = ?';
            query       = [qryObj.lat, qryObj.lon];    
        }

        // 3. Neither the 'treatmentId' nor 'q' are present. The query 
        // A standard SQL query is performed against the treatments table
        else {

            let cols = [];
            let vals = [];

            for (let col in qryObj) {

                if (col !== 'id') {
                    vals.push( qryObj[col] )

                    // we add double quotes to 'order' otherwise the sql 
                    // statement would choke since order is a reserved word
                    if (col === 'order') col = '"order"';
                    cols.push(col + ' = ?');
                }

            }

            //whatCols = [...whatCols, ...citationCols];
            what       += citation;
            fromTables  = 'treatments t';
            where       = cols.join(' AND ');
            query       = vals;
        }

        selectCount = `SELECT ${count} FROM ${fromTables} WHERE ${where}`;
        select      = `SELECT ${what} FROM ${fromTables} WHERE ${where} LIMIT ${limit}`;

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
