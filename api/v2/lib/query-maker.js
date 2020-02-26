'use strict';

const debug = false;
const chalk = require('chalk');

const qryFrags = {

    treatments: {

        q: {
            column: 'snippet(vtreatments, 1, "<b>", "</b>", "", 50) AS context',
            table: 'vtreatments ON treatments.treatmentId = vtreatments.treatmentId',
            condition: 'vtreatments MATCH @q'
        },

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

            // BLR-Website Issue 10: removed from facets
            // https://github.com/plazi/BLR-website/issues/10
            //
            // journalVolume: {
            //     columns: ['journalVolume', 'Count(journalVolume) AS c'],
            //     tables: ['treatments'],
            //     condition: ["treatments.deleted = 0 AND journalVolume != ''"]
            // },

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

        },

        sortable: ['journalYear'],
        sortcol: 'treatments.treatmentId',
        sortdir: 'ASC'
    
    },

    citations: {

        q: {
            column: 1,
            table: 'vbibrefcitations ON bibRefCitations.bibRefCitationId = vbibrefcitations.bibRefCitationId',
            condition: 'vbibrefcitations MATCH @q'
        },

        data: {
            columns: ['id', 'bibRefCitations.bibRefCitationId', 'bibRefCitations.treatmentId', 'bibRefCitations.refString', 'type', 'year'],
            tables: ['bibRefCitations'],
            condition: ['bibRefCitations.deleted = 0']
        },

        stats: {

            'count by year': {
                columns: ['DISTINCT(year) y', 'COUNT(year) c'], 
                tables: ['bibRefCitations JOIN vbibrefcitations ON bibRefCitations.bibRefCitationId = vbibrefcitations.bibRefCitationId'],
                condition: ["bibRefCitations.delete = 0 AND year != ''"],
            }

        },

        count: {
            columns: ['Count(*) AS numOfRecords'],
            tables: ['bibRefCitations'],
            condition: ['bibRefCitations.deleted = 0']
        },

        facets: {
            'count by year': {
                columns: ['DISTINCT(year) y', 'COUNT(year) c'],
                tables: ['bibRefCitations'],
                condition: ["bibRefCitations.deleted = 0 AND year != ''"]
            },

            'type of citation': {
                columns: ['DISTINCT(type) t', 'COUNT(type) c'],
                tables: ['bibRefCitations'],
                condition: ["bibRefCitations.deleted = 0 AND year != ''"]
            }

        },

        sortable: [],
        sortcol: 'bibRefCitations.bibRefCitationId',
        sortdir: 'ASC'
    }

};

const queryMaker = function(queryObject) {

    const resource = queryObject.resource;

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

    const queryFragments = JSON.parse(JSON.stringify(qryFrags[resource]));

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
    if (queryObject.bibrefcitationid) {
        queries.selcount = 1;
        queries.seldata = `${select} ${queryFragments.data.columns.join(', ')} ${from} bibRefCitations ${where} deleted = 0 AND bibRefCitationId = @bibrefcitationid`;
        queries.selrelated = {

            treatmentAuthors: 'SELECT treatmentAuthorId, treatmentAuthor AS author FROM treatmentAuthors WHERE deleted = 0 AND treatmentId = @treatmentId',
            
            treatments: 'SELECT treatmentId.* FROM treatments WHERE deleted = 0 AND treatmentId = @treatmentId'
        }

    }
    else {

        // the following are the only valid columns for sorting
        const sortable = queryFragments.sortable;
        let sortcol = queryFragments.sortcol;
        let sortdir = queryFragments.sortdir;

        let noParams = true;

        for (let param in queryObject) {
            if (param.toLowerCase() === 'sortby') {

                [sortcol, sortdir] = queryObject[param].split(':');
                sortdir = sortdir.toLowerCase();

                if (!sortable.includes(sortcol)) {

                    // default 'sortcol'
                    sortcol = queryFragments.sortcol;
                }

                if (sortdir !== 'asc' && sortdir !== 'desc') {

                    // default 'sortdir'
                    sortdir = queryFragments.sortdir;
                }
            }

            else if (queryFragments.data.columns.includes(param)) {

                noParams = false;

                // special syntax for dealing with a column called 'order'
                const o = '"order" = @order';

                if (param === 'order') {
                    queryFragments.data.condition.push(o);
                }
                else {
                    queryFragments.data.condition.push(`${param} = @${param}`);
                }

                for (let stat in queryFragments.stats) {

                    if (param === 'order') {
                        queryFragments.stats[stat].condition.push(o);
                    }
                    else {
                        queryFragments.stats[stat].condition.push(`${param} = @${param}`);
                    }
                    
                }

                for (let facet in queryFragments.facets) {

                    if (param === 'order') {
                        queryFragments.facets[facet].condition.push(o);
                    }
                    else {
                        queryFragments.facets[facet].condition.push(`${param} = @${param}`);
                    }
                    
                }

                queryFragments.count.condition.push(`${param} = @${param}`);

            }

            else if (param === 'q') {

                noParams = false;

                const q = queryFragments.q;
                queryFragments.data.columns.push(q.column);
                queryFragments.data.tables.push(q.table);
                queryFragments.data.condition.push(q.condition);

                if (sortcol === 'treatmentId') {
                    sortcol = 'treatments.treatmentId';
                }
                else if (sortcol === 'bibRefCitationId') {
                    sortcol = 'bibRefCitations.bibRefCitationId';
                }

                for (let stat in queryFragments.stats) {

                    //queryFragments.stats[stat].tables.push(q.table);
                    queryFragments.stats[stat].condition.push(`treatments.treatmentId IN (SELECT treatmentId FROM vtreatments WHERE ${q.condition})`);
                    
                }

                for (let facet in queryFragments.facets) {

                    //queryFragments.facets[facet].tables.push(q.table);
                    queryFragments.facets[facet].condition.push(`treatments.treatmentId IN (SELECT treatmentId FROM vtreatments WHERE ${q.condition})`);
                    
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