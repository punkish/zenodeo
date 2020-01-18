'use strict';

const debug = false;
const chalk = require('chalk');

const q = {
    column: 'snippet(vtreatments, 1, "<b>", "</b>", "", 50) AS context',
    table: 'vtreatments ON treatments.treatmentId = vtreatments.treatmentId',
    condition: 'vtreatments MATCH @q'
};

const qryFrags = {

    data: {
        columns: ['id', 'treatments.treatmentId', 'treatmentTitle', 'doi AS articleDoi', 'zenodoDep', 'zoobank', 'articleTitle', 'publicationDate', 'journalTitle', 'journalYear', 'journalVolume', 'journalIssue', 'pages', 'authorityName', 'authorityYear', 'kingdom', 'phylum', '"order"', 'family', 'genus', 'species', 'status', 'taxonomicNameLabel', 'treatments.rank'],
        tables: ['treatments'],
        condition: ['treatments.deleted = 0']
    },

    stats: {

        specimens: {
            columns: ['Sum(specimenCount)'], 
            tables: ['materialsCitations JOIN treatments ON materialsCitations.treatmentId = treatments.treatmentId'],
            condition: ["treatments.deleted = 0 AND materialsCitations.deleted = 0 AND specimenCount != ''"],
        },

        'male specimens': {
            columns: ['Sum(specimenCountMale)'], 
            tables: ['materialsCitations JOIN treatments ON materialsCitations.treatmentId = treatments.treatmentId'],
            condition: ["treatments.deleted = 0 AND materialsCitations.deleted = 0 AND specimenCountMale != ''"],
        },

        'female specimens': {
            columns: ['Sum(specimenCountFemale)'], 
            tables: ['materialsCitations JOIN treatments ON materialsCitations.treatmentId = treatments.treatmentId'],
            condition: ["treatments.deleted = 0 AND materialsCitations.deleted = 0 AND specimenCountFemale != ''"]
        },

        'treatments with specimens': {
            columns: ['Count(DISTINCT treatments.treatmentId)'], 
            tables: ['materialsCitations JOIN treatments ON materialsCitations.treatmentId = treatments.treatmentId'],
            condition: ["treatments.deleted = 0 AND materialsCitations.deleted = 0 AND specimenCount != ''"]
        },

        'treatments with male specimens': {
            columns: ['Count(DISTINCT treatments.treatmentId)'], 
            tables: ['materialsCitations JOIN treatments ON materialsCitations.treatmentId = treatments.treatmentId'],
            condition: ["treatments.deleted = 0 AND materialsCitations.deleted = 0 AND specimenCountMale != ''"]
        },

        'treatments with female specimens': {
            columns: ['Count(DISTINCT treatments.treatmentId)'], 
            tables: ['materialsCitations JOIN treatments ON materialsCitations.treatmentId = treatments.treatmentId'],
            condition: ["treatments.deleted = 0 AND materialsCitations.deleted = 0 AND specimenCountFemale != ''"]
        },

        'figure citations': {
            columns: ['Count(figureCitationId)'], 
            tables: ['figureCitations JOIN treatments ON figureCitations.treatmentId = treatments.treatmentId'],
            condition: ["treatments.deleted = 0 AND figureCitations.deleted = 0"]
        }
    },

    count: {
        columns: ['Count(treatments.treatmentId) AS numOfRecords'],
        tables: ['treatments'],
        condition: ['treatments.deleted = 0']
    },

    facets: {
        journalVolume: {
            columns: ['journalVolume', 'Count(journalVolume) AS c'],
            tables: ['treatments'],
            condition: ["treatments.deleted = 0 AND journalVolume != ''"]
        },

        journalTitle: {
            columns: ['journalTitle', 'Count(journalTitle) AS c'],
            tables: ['treatments'],
            condition: ["treatments.deleted = 0 AND journalTitle != ''"]
        },

        journalYear: {
            columns: ['journalYear', 'Count(journalYear) AS c'],
            tables: ['treatments'],
            condition: ["treatments.deleted = 0 AND journalYear != ''"]
        },

        kingdom: {
            columns: ['kingdom', 'Count(kingdom) AS c'],
            tables: ['treatments'],
            condition: ["treatments.deleted = 0 AND kingdom != ''"]
        },

        phylum: {
            columns: ['phylum', 'Count(phylum) AS c'],
            tables: ['treatments'],
            condition: ["treatments.deleted = 0 AND phylum != ''"]
        },

        order: {
            columns: ['"order"', 'Count("order") AS c'],
            tables: ['treatments'],
            condition: ["treatments.deleted = 0 AND \"order\" != ''"]
        },

        family: {
            columns: ['family', 'Count(family) AS c'],
            tables: ['treatments'],
            condition: ["treatments.deleted = 0 AND family != ''"]
        },

        genus: {
            columns: ['genus', 'Count(genus) AS c'],
            tables: ['treatments'],
            condition: ["treatments.deleted = 0 AND genus != ''"]
        },

        status: {
            columns: ['status', 'Count(status) AS c'],
            tables: ['treatments'],
            condition: ["treatments.deleted = 0 AND status != ''"]
        },

        rank: {
            columns: ['treatments.rank', 'Count(treatments.rank) AS c'],
            tables: ['treatments'],
            condition: ["treatments.deleted = 0 AND treatments.rank != ''"]
        },

        species: {
            columns: ['species', 'Count(species) AS c'],
            tables: ['treatments'],
            condition: ["treatments.deleted = 0 AND species != ''"]
        },

        collectionCode: {
            columns: ['collectionCode', 'Count(collectionCode) AS c'],
            tables: ['materialsCitations JOIN treatments on materialsCitations.treatmentId = treatments.treatmentId'],
            condition: ["treatments.deleted = 0 AND collectionCode != ''"]
        }

    }

};

const queryMaker = function(queryObject) {

    const queries = {
        selcount: '',
        seldata: '',
        selrelated: {},
        selstats: {},
        selfacets: {}
    }

    let select = 'SELECT';
    let from = 'FROM';
    let where = 'WHERE';

    if (debug) {
        select = chalk.red.bold(select);
        from = chalk.red.bold(from);
        where = chalk.red.bold(where);
    }

    const queryFragments = JSON.parse(JSON.stringify(qryFrags));

    if (queryObject.treatmentId) {
        queries.selcount = 1;
        queries.seldata = `${select} ${queryFragments.data.columns.join(', ')} ${from} treatments ${where} deleted = 0 AND treatmentId = @treatmentId`;
        queries.selrelated = {

            treatmentAuthors: 'SELECT treatmentAuthorId, treatmentAuthor AS author FROM treatmentAuthors WHERE deleted = 0 AND treatmentId = @treatmentId',
            
            bibRefCitations: 'SELECT bibRefCitationId, refString AS citation FROM bibRefCitations WHERE deleted = 0 AND treatmentId = @treatmentId',
            
            materialsCitations: "SELECT materialsCitationId, treatmentId, typeStatus, latitude, longitude FROM materialsCitations WHERE deleted = 0 AND latitude != '' AND longitude != '' AND treatmentId = @treatmentId",
            
            figureCitations: 'SELECT figureCitationId, captionText, httpUri, thumbnailUri FROM figureCitations WHERE deleted = 0 AND treatmentId = @treatmentId'
        }

    }
    else {

        // the following are the only valid columns for sorting
        const sortable = ['journalYear'];
        let sortcol = 'treatments.treatmentId';
        let sortdir = 'ASC';

        let noParams = true;

        for (let param in queryObject) {

            if (param.toLowerCase() === 'sortby') {

                [sortcol, sortdir] = queryObject[param].split(':');
                sortdir = sortdir.toLowerCase();

                if (!sortable.includes(sortcol)) {

                    // default 'sortcol'
                    sortcol = 'treatments.treatmentId';
                }

                if (sortdir !== 'asc' && sortdir !== 'desc') {
                    sortdir = 'ASC';
                }
            }

            else if (queryFragments.data.columns.includes(param)) {

                noParams = false;

                if (param === 'order') {
                    queryFragments.data.condition.push('"order" = @order');
                }
                else {
                    queryFragments.data.condition.push(`${param} = @${param}`);
                }

                for (let stat in queryFragments.stats) {

                    if (param === 'order') {
                        queryFragments.stats[stat].condition.push('"order" = @order');
                    }
                    else {
                        queryFragments.stats[stat].condition.push(`${param} = @${param}`);
                    }
                    
                }

                for (let facet in queryFragments.facets) {

                    if (param === 'order') {
                        queryFragments.facets[facet].condition.push('"order" = @order');
                    }
                    else {
                        queryFragments.facets[facet].condition.push(`${param} = @${param}`);
                    }
                    
                }

                queryFragments.count.condition.push(`${param} = @${param}`);

            }

            else if (param === 'q') {

                noParams = false;

                queryFragments.data.columns.push(q.column);
                queryFragments.data.tables.push(q.table);
                queryFragments.data.condition.push(q.condition);

                if (sortcol === 'treatmentId') {
                    sortcol = 'treatments.treatmentId';
                }

                for (let stat in queryFragments.stats) {

                    queryFragments.stats[stat].tables.push(q.table);
                    queryFragments.stats[stat].condition.push(q.condition);
                    
                }

                for (let facet in queryFragments.facets) {

                    queryFragments.facets[facet].tables.push(q.table);
                    queryFragments.facets[facet].condition.push(q.condition);
                    
                }

                queryFragments.count.tables.push(q.table);
                queryFragments.count.condition.push(q.condition);
            }
        }

        //const id = queryObject.id ? parseInt(queryObject.id) : 0;
        const page = queryObject.page ? parseInt(queryObject.page) : 1;
        const limit = queryObject.size ? parseInt(queryObject.size) : 30;
        const offset = (page - 1) * limit;

        queries.selcount = `${select} ${queryFragments.count.columns.join(', ')} ${from} ${queryFragments.count.tables.join(' JOIN ')} ${where} ${queryFragments.count.condition.join(' AND ')}`;

        queries.seldata = `${select} ${queryFragments.data.columns.join(', ')} ${from} ${queryFragments.data.tables.join(' JOIN ')} ${where} ${queryFragments.data.condition.join(' AND ')} ORDER BY ${sortcol} ${sortdir} LIMIT ${limit} OFFSET ${offset}`;
        
        for (let stat in queryFragments.stats) {
            queries.selstats[stat] = `${select} ${queryFragments.stats[stat].columns.join(', ')} ${from} ${queryFragments.stats[stat].tables.join(' JOIN ')} ${where} ${queryFragments.stats[stat].condition.join(' AND ')}`;
        }

        for (let facet in queryFragments.facets) {
            let group = facet;
            if (facet === 'order') {
                group = '"order"';
            }
            else if (facet === 'rank') {
                group = 'treatments.rank';
            }

            queries.selfacets[facet] = `${select} ${queryFragments.facets[facet].columns.join(', ')} ${from} ${queryFragments.facets[facet].tables.join(' JOIN ')} ${where} ${queryFragments.facets[facet].condition.join(' AND ')} GROUP BY ${group}`;
        }
    }
    
    if (debug) {
        for (let q in queries) {
            if (typeof queries[q] === 'object') {
                
                let subq = queries[q];
                for (let s in subq) {
                    console.log(`${chalk.blue(s)}: ${subq[s]}`, '\n');
                    console.log('-'.repeat(40), '\n');
                }
    
            }
            else {
                
                console.log(`${chalk.blue(q)}: ${queries[q]}`);
                console.log('-'.repeat(40), '\n');

            }
        }
    }

    return queries;
};

module.exports = queryMaker;

// const qo = [
//     {"facets":true,"page":1,"size":30,"refreshCache":false,"sortBy":"treatmentId:ASC","stats":false},
//     {"journalYear":"2005","family":"Amaranthaceae","page":1,"size":30,"refreshCache":false,"sortBy":"treatmentId:ASC","facets":false,"stats":false},
//     {"stats":true,"page":1,"size":30,"refreshCache":false,"sortBy":"treatmentId:ASC","facets":false},
//     {"facets":true,"stats":true,"page":1,"size":30,"refreshCache":false,"sortBy":"treatmentId:ASC"},
//     {"facets":true,"stats":true,"q":"maratus","page":1,"size":30,"refreshCache":false,"sortBy":"treatmentId:ASC"},
//     {"facets":true,"stats":true,"q":"opulifolium","journalYear":"2005","page":1,"size":30,"refreshCache":false,"sortBy":"treatmentId:ASC"},
//     {"facets":false,"family":"Enicocephalidae","kingdom":"Animalia","order":"Hemiptera","page":1,"phylum":"Arthropoda","size":30,"sortBy":"treatmentId:ASC","stats":false,"refreshCache":false}
// ];

// for (let i = 0, j = qo.length; i < j; i++) {
//     queryMaker(qo[i]);
// }