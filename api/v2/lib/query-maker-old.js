'use strict';

// const debug = false;
// const chalk = require('chalk');

// const qryFrags = {

//     treatments: {

//         q: {
//             column: 'snippet(vtreatments, 1, "<b>", "</b>", "", 50) AS context',
//             table: 'vtreatments ON treatments.treatmentId = vtreatments.treatmentId',
//             condition: 'vtreatments MATCH @q'
//         },

//         data: {
//             columns: ['id', 'treatments.treatmentId', 'treatmentTitle', 'doi AS articleDoi', 'zenodoDep', 'zoobank', 'articleTitle', 'publicationDate', 'journalTitle', 'journalYear', 'journalVolume', 'journalIssue', 'pages', 'authorityName', 'authorityYear', 'kingdom', 'phylum', '"order"', 'family', 'genus', 'species', 'status', 'taxonomicNameLabel', 'treatments.rank'],
//             tables: ['treatments'],
//             condition: ['treatments.deleted = 0']
//         },

//         stats: {

//             specimens: {
//                 columns: ['Sum(specimenCount)'], 
//                 tables: ['materialsCitations JOIN treatments ON materialsCitations.treatmentId = treatments.treatmentId'],
//                 condition: ["treatments.deleted = 0 AND materialsCitations.deleted = 0 AND specimenCount != ''"],
//             },

//             'male specimens': {
//                 columns: ['Sum(specimenCountMale)'], 
//                 tables: ['materialsCitations JOIN treatments ON materialsCitations.treatmentId = treatments.treatmentId'],
//                 condition: ["treatments.deleted = 0 AND materialsCitations.deleted = 0 AND specimenCountMale != ''"],
//             },

//             'female specimens': {
//                 columns: ['Sum(specimenCountFemale)'], 
//                 tables: ['materialsCitations JOIN treatments ON materialsCitations.treatmentId = treatments.treatmentId'],
//                 condition: ["treatments.deleted = 0 AND materialsCitations.deleted = 0 AND specimenCountFemale != ''"]
//             },

//             'treatments with specimens': {
//                 columns: ['Count(DISTINCT treatments.treatmentId)'], 
//                 tables: ['materialsCitations JOIN treatments ON materialsCitations.treatmentId = treatments.treatmentId'],
//                 condition: ["treatments.deleted = 0 AND materialsCitations.deleted = 0 AND specimenCount != ''"]
//             },

//             'treatments with male specimens': {
//                 columns: ['Count(DISTINCT treatments.treatmentId)'], 
//                 tables: ['materialsCitations JOIN treatments ON materialsCitations.treatmentId = treatments.treatmentId'],
//                 condition: ["treatments.deleted = 0 AND materialsCitations.deleted = 0 AND specimenCountMale != ''"]
//             },

//             'treatments with female specimens': {
//                 columns: ['Count(DISTINCT treatments.treatmentId)'], 
//                 tables: ['materialsCitations JOIN treatments ON materialsCitations.treatmentId = treatments.treatmentId'],
//                 condition: ["treatments.deleted = 0 AND materialsCitations.deleted = 0 AND specimenCountFemale != ''"]
//             },

//             'figure citations': {
//                 columns: ['Count(figureCitationId)'], 
//                 tables: ['figureCitations JOIN treatments ON figureCitations.treatmentId = treatments.treatmentId'],
//                 condition: ["treatments.deleted = 0 AND figureCitations.deleted = 0"]
//             }
//         },

//         count: {
//             columns: ['Count(*) AS numOfRecords'],
//             tables: ['treatments'],
//             condition: ['treatments.deleted = 0']
//         },

//         facets: {

//             // BLR-Website Issue 10: removed from facets
//             // https://github.com/plazi/BLR-website/issues/10
//             //
//             // journalVolume: {
//             //     columns: ['journalVolume', 'Count(journalVolume) AS c'],
//             //     tables: ['treatments'],
//             //     condition: ["treatments.deleted = 0 AND journalVolume != ''"]
//             // },

//             journalTitle: {
//                 columns: ['journalTitle', 'Count(journalTitle) AS c'],
//                 tables: ['treatments'],
//                 condition: ["treatments.deleted = 0 AND journalTitle != ''"]
//             },

//             journalYear: {
//                 columns: ['journalYear', 'Count(journalYear) AS c'],
//                 tables: ['treatments'],
//                 condition: ["treatments.deleted = 0 AND journalYear != ''"]
//             },

//             // BLR-Website Issue 11: removed from facets
//             // https://github.com/plazi/BLR-website/issues/11
//             // https://github.com/plazi/BLR-website/blob/master/facets.md#treatments
//             //
//             // kingdom: {
//             //     columns: ['kingdom', 'Count(kingdom) AS c'],
//             //     tables: ['treatments'],
//             //     condition: ["treatments.deleted = 0 AND kingdom != ''"]
//             // },

//             // phylum: {
//             //     columns: ['phylum', 'Count(phylum) AS c'],
//             //     tables: ['treatments'],
//             //     condition: ["treatments.deleted = 0 AND phylum != ''"]
//             // },

//             // order: {
//             //     columns: ['"order"', 'Count("order") AS c'],
//             //     tables: ['treatments'],
//             //     condition: ["treatments.deleted = 0 AND \"order\" != ''"]
//             // },

//             // family: {
//             //     columns: ['family', 'Count(family) AS c'],
//             //     tables: ['treatments'],
//             //     condition: ["treatments.deleted = 0 AND family != ''"]
//             // },

//             // genus: {
//             //     columns: ['genus', 'Count(genus) AS c'],
//             //     tables: ['treatments'],
//             //     condition: ["treatments.deleted = 0 AND genus != ''"]
//             // },

//             // species: {
//             //     columns: ['species', 'Count(species) AS c'],
//             //     tables: ['treatments'],
//             //     condition: ["treatments.deleted = 0 AND species != ''"]
//             // },

//             status: {
//                 columns: ['status', 'Count(status) AS c'],
//                 tables: ['treatments'],
//                 condition: ["treatments.deleted = 0 AND status != ''"]
//             },
            
//             rank: {
//                 columns: ['treatments.rank', 'Count(treatments.rank) AS c'],
//                 tables: ['treatments'],
//                 condition: ["treatments.deleted = 0 AND treatments.rank != ''"]
//             },

//             collectionCode: {
//                 columns: ['collectionCode', 'Count(collectionCode) AS c'],
//                 tables: ['materialsCitations JOIN treatments on materialsCitations.treatmentId = treatments.treatmentId'],
//                 condition: ["treatments.deleted = 0 AND collectionCode != ''"]
//             }

//         },

//         sortable: ['journalYear'],
//         sortcol: 'treatments.treatmentId',
//         sortdir: 'ASC'
    
//     },

//     citations: {

//         q: {
//             column: 1,
//             table: 'vbibrefcitations ON bibRefCitations.bibRefCitationId = vbibrefcitations.bibRefCitationId',
//             condition: 'vbibrefcitations MATCH @q'
//         },

//         data: {
//             columns: ['id', 'bibRefCitations.bibRefCitationId', 'bibRefCitations.treatmentId', 'bibRefCitations.refString', 'type', 'year'],
//             tables: ['bibRefCitations'],
//             condition: ['bibRefCitations.deleted = 0']
//         },

//         stats: {

//             'count by year': {
//                 columns: ['DISTINCT(year) y', 'COUNT(year) c'], 
//                 tables: ['bibRefCitations JOIN vbibrefcitations ON bibRefCitations.bibRefCitationId = vbibrefcitations.bibRefCitationId'],
//                 condition: ["bibRefCitations.delete = 0 AND year != ''"],
//             }

//         },

//         count: {
//             columns: ['Count(*) AS numOfRecords'],
//             tables: ['bibRefCitations'],
//             condition: ['bibRefCitations.deleted = 0']
//         },

//         facets: {
//             'count by year': {
//                 columns: ['DISTINCT(year) y', 'COUNT(year) c'],
//                 tables: ['bibRefCitations'],
//                 condition: ["bibRefCitations.deleted = 0 AND year != ''"]
//             },

//             'type of citation': {
//                 columns: ['DISTINCT(type) t', 'COUNT(type) c'],
//                 tables: ['bibRefCitations'],
//                 condition: ["bibRefCitations.deleted = 0 AND year != ''"]
//             }

//         },

//         sortable: [],
//         sortcol: 'bibRefCitations.bibRefCitationId',
//         sortdir: 'ASC'
//     },

//     treatmentAuthors: {
//         none: {
//             stats: {
//                 authors: {
//                     columns: ['Count(*)'], 
//                     tables: ['treatmentAuthors'],
//                     condition: ['deleted = 0']
//                 }
//             }
//         },
//         one: {
//             data: 'SELECT treatmentAuthorId, treatmentId, treatmentAuthor FROM treatmentAuthors WHERE treatmentAuthorId = @treatmentAuthorId',
            
//             related: {
//                 treatments: 'SELECT t.id, t.treatmentId, t.treatmentTitle, authorityName || ". " || authorityYear || ". <i>" || articleTitle || ".</i> " || journalTitle || ", " || journalYear || ", pp. " || pages || ", vol. " || journalVolume || ", issue " || journalIssue AS context FROM treatments t JOIN treatmentAuthors a ON t.treatmentId = a.treatmentId WHERE a.treatmentAuthorId = @treatmentAuthorId',
//             }
//         },
//         many: {
//             q: {
//                 count: 'SELECT Count(treatmentAuthorId) AS numOfRecords FROM treatmentAuthors WHERE treatmentAuthor LIKE @q',
                
//                 data: 'SELECT treatmentAuthorId, treatmentId, treatmentAuthor FROM treatmentAuthors WHERE treatmentAuthor LIKE @q LIMIT @limit OFFSET @offset',
                
//                 stats: {
//                     authors: {
//                         columns: ['Count(*)'], 
//                         tables: ['treatmentAuthors'],
//                         condition: ['deleted = 0']
//                     }
//                 }
//             }
//         }
//     }
// };

// const queryMaker = function(queryObject) {

//     const resources = queryObject.resources;

//     const queries = {
//         selcount: '',
//         seldata: '',
//         selrelated: {},
//         selstats: {},
//         selfacets: {}
//     }

//     let select = 'SELECT';
//     let from = 'FROM';
//     let where = 'WHERE';

//     if (debug) {
//         select = chalk.red.bold(select);
//         from = chalk.red.bold(from);
//         where = chalk.red.bold(where);
//     }

//     const queryFragments = JSON.parse(JSON.stringify(qryFrags[resources]));

//     if (queryObject.treatmentId) {
//         queries.selcount = 1;
//         queries.seldata = `${select} ${queryFragments.data.columns.join(', ')} ${from} treatments ${where} deleted = 0 AND treatmentId = @treatmentId`;
//         queries.selrelated = {

//             treatmentAuthors: 'SELECT treatmentAuthorId, treatmentAuthor AS author FROM treatmentAuthors WHERE deleted = 0 AND treatmentId = @treatmentId',
            
//             bibRefCitations: 'SELECT bibRefCitationId, refString AS citation FROM bibRefCitations WHERE deleted = 0 AND treatmentId = @treatmentId',
            
//             materialsCitations: "SELECT materialsCitationId, treatmentId, typeStatus, latitude, longitude FROM materialsCitations WHERE deleted = 0 AND latitude != '' AND longitude != '' AND treatmentId = @treatmentId",
            
//             figureCitations: 'SELECT figureCitationId, captionText, httpUri, thumbnailUri FROM figureCitations WHERE deleted = 0 AND treatmentId = @treatmentId'
//         }

//     }
//     if (queryObject.bibrefcitationid) {
//         queries.selcount = 1;
//         queries.seldata = `${select} ${queryFragments.data.columns.join(', ')} ${from} bibRefCitations ${where} deleted = 0 AND bibRefCitationId = @bibrefcitationid`;
//         queries.selrelated = {

//             treatmentAuthors: 'SELECT treatmentAuthorId, treatmentAuthor AS author FROM treatmentAuthors WHERE deleted = 0 AND treatmentId = @treatmentId',
            
//             treatments: 'SELECT treatmentId.* FROM treatments WHERE deleted = 0 AND treatmentId = @treatmentId'
//         }

//     }
//     else {

//         // the following are the only valid columns for sorting
//         const sortable = queryFragments.sortable;
//         let sortcol = queryFragments.sortcol;
//         let sortdir = queryFragments.sortdir;

//         let noParams = true;

//         for (let param in queryObject) {
//             if (param.toLowerCase() === 'sortby') {

//                 [sortcol, sortdir] = queryObject[param].split(':');
//                 sortdir = sortdir.toLowerCase();

//                 if (!sortable.includes(sortcol)) {

//                     // default 'sortcol'
//                     sortcol = queryFragments.sortcol;
//                 }

//                 if (sortdir !== 'asc' && sortdir !== 'desc') {

//                     // default 'sortdir'
//                     sortdir = queryFragments.sortdir;
//                 }
//             }

//             else if (queryFragments.data.columns.includes(param)) {

//                 noParams = false;

//                 // special syntax for dealing with a column called 'order'
//                 const o = '"order" = @order';

//                 if (param === 'order') {
//                     queryFragments.data.condition.push(o);
//                 }
//                 else {
//                     queryFragments.data.condition.push(`${param} = @${param}`);
//                 }

//                 for (let stat in queryFragments.stats) {

//                     if (param === 'order') {
//                         queryFragments.stats[stat].condition.push(o);
//                     }
//                     else {
//                         queryFragments.stats[stat].condition.push(`${param} = @${param}`);
//                     }
                    
//                 }

//                 for (let facet in queryFragments.facets) {

//                     if (param === 'order') {
//                         queryFragments.facets[facet].condition.push(o);
//                     }
//                     else {
//                         queryFragments.facets[facet].condition.push(`${param} = @${param}`);
//                     }
                    
//                 }

//                 queryFragments.count.condition.push(`${param} = @${param}`);

//             }

//             else if (param === 'q') {

//                 noParams = false;

//                 const q = queryFragments.q;
//                 queryFragments.data.columns.push(q.column);
//                 queryFragments.data.tables.push(q.table);
//                 queryFragments.data.condition.push(q.condition);

//                 if (sortcol === 'treatmentId') {
//                     sortcol = 'treatments.treatmentId';
//                 }
//                 else if (sortcol === 'bibRefCitationId') {
//                     sortcol = 'bibRefCitations.bibRefCitationId';
//                 }

//                 for (let stat in queryFragments.stats) {

//                     //queryFragments.stats[stat].tables.push(q.table);
//                     queryFragments.stats[stat].condition.push(`treatments.treatmentId IN (SELECT treatmentId FROM vtreatments WHERE ${q.condition})`);
                    
//                 }

//                 for (let facet in queryFragments.facets) {

//                     //queryFragments.facets[facet].tables.push(q.table);
//                     queryFragments.facets[facet].condition.push(`treatments.treatmentId IN (SELECT treatmentId FROM vtreatments WHERE ${q.condition})`);
                    
//                 }

//                 queryFragments.count.tables.push(q.table);
//                 queryFragments.count.condition.push(q.condition);
//             }
//         }

//         //const id = queryObject.id ? parseInt(queryObject.id) : 0;
//         const page = queryObject.page ? parseInt(queryObject.page) : 1;
//         const limit = queryObject.size ? parseInt(queryObject.size) : 30;
//         const offset = (page - 1) * limit;

//         queries.selcount = `${select} ${queryFragments.count.columns.join(', ')} ${from} ${queryFragments.count.tables.join(' JOIN ')} ${where} ${queryFragments.count.condition.join(' AND ')}`;

//         queries.seldata = `${select} ${queryFragments.data.columns.join(', ')} ${from} ${queryFragments.data.tables.join(' JOIN ')} ${where} ${queryFragments.data.condition.join(' AND ')} ORDER BY ${sortcol} ${sortdir} LIMIT ${limit} OFFSET ${offset}`;
        
//         for (let stat in queryFragments.stats) {
//             queries.selstats[stat] = `${select} ${queryFragments.stats[stat].columns.join(', ')} ${from} ${queryFragments.stats[stat].tables.join(' JOIN ')} ${where} ${queryFragments.stats[stat].condition.join(' AND ')}`;
//         }

//         for (let facet in queryFragments.facets) {
//             let group = facet;
//             if (facet === 'order') {
//                 group = '"order"';
//             }
//             else if (facet === 'rank') {
//                 group = 'treatments.rank';
//             }

//             queries.selfacets[facet] = `${select} ${queryFragments.facets[facet].columns.join(', ')} ${from} ${queryFragments.facets[facet].tables.join(' JOIN ')} ${where} ${queryFragments.facets[facet].condition.join(' AND ')} GROUP BY ${group}`;
//         }
//     }
    
//     if (debug) {
//         for (let q in queries) {
//             if (typeof queries[q] === 'object') {
                
//                 let subq = queries[q];
//                 for (let s in subq) {
//                     console.log(`${chalk.blue(s)}: ${subq[s]}`, '\n');
//                     console.log('-'.repeat(40), '\n');
//                 }
    
//             }
//             else {
                
//                 console.log(`${chalk.blue(q)}: ${queries[q]}`);
//                 console.log('-'.repeat(40), '\n');

//             }
//         }
//     }

//     return queries;
// };

const qryParts = {
    treatments: {

        // data queries
        data: {
            columns: ['id', 'treatments.treatmentId', 'treatmentTitle', 'doi AS articleDoi', 'zenodoDep', 'zoobank', 'articleTitle', 'publicationDate', 'journalTitle', 'journalYear', 'journalVolume', 'journalIssue', 'pages', 'authorityName', 'authorityYear', 'kingdom', 'phylum', '"order"', 'family', 'genus', 'species', 'status', 'taxonomicNameLabel', 'treatments.rank'],
            tables: ['treatments'],
            where: ['treatments.deleted = 0'],
            sortBy: {
                columns: ['journalYear'],
                defaultSort: {
                    col: 'journalYear',
                    dir: 'ASC'
                }
            }
        },

        // count query
        count: {
            columns: ['Count(*) as numOfRecords'],
            tables: ['treatments'],
            where: ['treatments.deleted = 0']
        },

        stats: {

            specimens: {
                columns: ['Sum(specimenCount)'], 
                tables: ['materialsCitations JOIN treatments ON materialsCitations.treatmentId = treatments.treatmentId'],
                where: ["treatments.deleted = 0 AND materialsCitations.deleted = 0 AND specimenCount != ''"],
            },

            'male specimens': {
                columns: ['Sum(specimenCountMale)'], 
                tables: ['materialsCitations JOIN treatments ON materialsCitations.treatmentId = treatments.treatmentId'],
                where: ["treatments.deleted = 0 AND materialsCitations.deleted = 0 AND specimenCountMale != ''"],
            },

            'female specimens': {
                columns: ['Sum(specimenCountFemale)'], 
                tables: ['materialsCitations JOIN treatments ON materialsCitations.treatmentId = treatments.treatmentId'],
                where: ["treatments.deleted = 0 AND materialsCitations.deleted = 0 AND specimenCountFemale != ''"]
            },

            'treatments with specimens': {
                columns: ['Count(DISTINCT treatments.treatmentId)'], 
                tables: ['materialsCitations JOIN treatments ON materialsCitations.treatmentId = treatments.treatmentId'],
                where: ["treatments.deleted = 0 AND materialsCitations.deleted = 0 AND specimenCount != ''"]
            },

            'treatments with male specimens': {
                columns: ['Count(DISTINCT treatments.treatmentId)'], 
                tables: ['materialsCitations JOIN treatments ON materialsCitations.treatmentId = treatments.treatmentId'],
                where: ["treatments.deleted = 0 AND materialsCitations.deleted = 0 AND specimenCountMale != ''"]
            },

            'treatments with female specimens': {
                columns: ['Count(DISTINCT treatments.treatmentId)'], 
                tables: ['materialsCitations JOIN treatments ON materialsCitations.treatmentId = treatments.treatmentId'],
                where: ["treatments.deleted = 0 AND materialsCitations.deleted = 0 AND specimenCountFemale != ''"]
            },

            // 'figure citations': {
            //     columns: ['Count(figureCitationId)'], 
            //     tables: ['figureCitations JOIN treatments ON figureCitations.treatmentId = treatments.treatmentId'],
            //     where: ["treatments.deleted = 0 AND figureCitations.deleted = 0"]
            // }
        },

        facets: {

            journalTitle: {
                columns: ['journalTitle', 'Count(journalTitle) AS c'],
                tables: ['treatments'],
                where: ["treatments.deleted = 0 AND journalTitle != ''"],
                group: ['journalTitle']
            },

            journalYear: {
                columns: ['journalYear', 'Count(journalYear) AS c'],
                tables: ['treatments'],
                where: ["treatments.deleted = 0 AND journalYear != ''"],
                group: ['journalYear']
            },

            status: {
                columns: ['status', 'Count(status) AS c'],
                tables: ['treatments'],
                where: ["treatments.deleted = 0 AND status != ''"],
                group: ['status']
            },
            
            rank: {
                columns: ['treatments.rank', 'Count(treatments.rank) AS c'],
                tables: ['treatments'],
                where: ['treatments.deleted = 0', 'treatments.rank != ""'],
                group: ['treatments.rank']
            },

            collectionCode: {
                columns: ['collectionCode', 'Count(collectionCode) AS c'],
                tables: ['materialsCitations', 'treatments ON materialsCitations.treatmentId = treatments.treatmentId'],
                where: ['treatments.deleted = 0', 'materialsCitations.deleted = 0', 'collectionCode != ""'],
                group: ['collectionCode']
            }

        }

    }
};

// We need sort params only for the data query.
// Here we figure out the sortcol and sortdir
const calcSortParams = function(qrySource, queryObject) {
    const sortBy = qrySource.sortBy;

    const columns = sortBy.columns;
    const defaultSortCol = sortBy.defaultSort.col;
    const defaultSortDir = sortBy.defaultSort.dir;

    let [sortcol, sortdir] = queryObject.sortBy.split(':');
    if (! columns.includes(sortcol)) {
        sortcol = defaultSortCol;
    }

    sortdir = sortdir.toUpperCase();
    if (sortdir !== 'ASC' || sortdir !== 'DESC') {
        sortdir = defaultSortDir
    }

    return [sortcol, sortdir];
};

const makeQueries = function({qryType, queryObject, plugins}) {

    const resources = plugins._resources;
    const qrySource = qryParts[resources][qryType];
    const columns = qrySource.columns;
    const tables = qrySource.tables;
    const where = qrySource.where;
    const whereLog = JSON.parse(JSON.stringify(qrySource.where));

    if (queryObject[plugins._resourceId]) {

        const idKey = plugins._resourceId;
        const idVal = queryObject[plugins._resourceId];

        let query = `SELECT ${columns.join(', ')} FROM ${tables.join(' JOIN ')} WHERE ${idKey} = @${idKey}`;
        let queryLog = `SELECT ${columns.join(', ')} FROM ${tables.join(' JOIN ')} WHERE ${idKey} = ${idVal}`;
        return [query, queryLog];
    }

    let sortcol = '';
    let sortdir = '';

    // the following params are valid in the URL but are not used 
    // for actually constructing the SQL query
    const invalidParams = ['resources', 'communities', 'facets', 'page', 'size', 'stats', 'xml'];

    for (let key in queryObject) {
        if (! invalidParams.includes(key)) {
            if (key === 'sortBy') {

                // sortby is *only* applicable when the query is for data
                if (qryType === 'data') {
                    [sortcol, sortdir] = calcSortParams(qrySource, queryObject);
                }
            }
            else if (key === 'q') {

                // when the key is 'q', the fulltext column is returned 
                // only for the data query. For all other queries, only 
                // the tables and the where constraint are applied 
                if (qryType === 'data') {
                    columns.push('snippet(vtreatments, 1, "<b>", "</b>", "", 50) AS context');
                }
                
                tables.push('vtreatments ON treatments.treatmentId = vtreatments.treatmentId');
                where.push('vtreatments MATCH @q');
                whereLog.push(`vtreatments MATCH "${queryObject.q}"`);
            }
            else {
                where.push(`${key} = @${key}`)
                whereLog.push(`${key} = "${queryObject[key]}"`);
            }
        }
    }

    let query = `SELECT ${columns.join(', ')} FROM ${tables.join(' JOIN ')} WHERE ${where.join(' AND ')}`;
    let queryLog = `SELECT ${columns.join(', ')} FROM ${tables.join(' JOIN ')} WHERE ${whereLog.join(' AND ')}`;

    if (qryType === 'data') {
        if (queryObject.sortby) {
            query += ` ORDER BY ${sortcol} ${sortdir}`;
            queryLog += ` ORDER BY ${sortcol} ${sortdir}`;
        }
    }

    // facet queries need GROUP BY clause. For example,
    //
    // SELECT 
    //     collectionCode, 
    //     Count(collectionCode) AS c 
    // FROM 
    //     materialsCitations JOIN 
    //     treatments ON materialsCitations.treatmentId = treatments.treatmentId JOIN 
    //     vtreatments ON treatments.treatmentId = vtreatments.treatmentId 
    // WHERE 
    //     treatments.deleted = 0 AND 
    //     materialsCitations.deleted = 0 AND 
    //     collectionCode != '' AND 
    //     vtreatments MATCH "Agosti" 
    // GROUP BY collectionCode;
    if (qryType === 'facets') {
        const group = qrySource.group;

        query += ` GROUP BY ${group.join(' AND ')}`;
        queryLog += ` GROUP BY ${group.join(' AND ')}`;
    }

    return [query, queryLog];
};

const qm = function({queryObject, plugins}) {

    // queries{} holds the SQL with @params that is actually used by 
    // the databse. queriesLog{} is the same query but with the 
    // actual params, and is used only to write out the logs
    const queries = {};
    const queriesLog = {};

    const resources = plugins._resources;

    // check if the PK exists in the queryObject. If there is a PK
    // then the query is for a specific record. In this case, we
    // need only the data query and nothing else
    if (queryObject[plugins._resourceId]) {

        const qryType = 'data';
        const [query, queryLog] = makeQueries({qryType, queryObject, plugins});
        queries[qryType] = query;
        queriesLog[qryType] = queryLog;

        return [queries, queriesLog];
    }

    // A query is made up of six parts
    //
    // mandatory parts
    // -----------------------------
    // SELECT <columns> 
    // FROM <tables> 
    // WHERE <WHERE> 
    //
    // optional parts
    // -----------------------------
    // GROUP BY <group>
    // ORDER BY <sortcol> <sortdir> 
    // LIMIT <limit> 
    // OFFSET <offset>


    

    // resources: treatments, treatmentAuthors
    const resources = queryObject.resources;

    // validQryTypes: data, count, stats, facets
    const validQryTypes = Object.keys(qryParts[resources]);

    let i = 0;
    const j = validQryTypes.length;

    for (; i < j; i++) {

        // the current qryType: data OR count OR stats, etc.
        const qryType = validQryTypes[i];
 
        if (qryType === 'stats' || qryType === 'facets') {

            // because facets and stats are really a bunch of queries,
            // they are grouped into a hash in queries{} and queriesLog()
            queries[qryType] = {};
            queriesLog[qryType] = {};

            // the actual queries from stats OR facets
            const qryGroup = qryParts[resources][qryType];

            for (let qry in qryGroup) {

                // qrySource is the set of columns, tables, where, and 
                // optionally group used to construct the query
                const qrySource = qryGroup[qry];

                const [query, queryLog] = makeQueries(qryType, qrySource, queryObject);
                queries[qryType][qry] = query;
                queriesLog[qryType][qry] = queryLog;
            }


        }
        else {
            const qrySource = qryParts[resources][qryType];

            const [query, queryLog] = makeQueries(qryType, qrySource, queryObject);
            queries[qryType] = query;
            queriesLog[qryType] = queryLog;
        }
        
    }

    return [queries, queriesLog];

};

module.exports = qm;

const queries = {
    count: {
        columns: [],
        tables: [],
        constraint: [],
        sort: {
            sortable: [],
            default: [
                {
                    column: '',
                    direction: ''
                }
            ],
            params: [
                {
                    column: '',
                    dir: ''
                }
            ]
        },
        group: []
    },
    data: {},
    facets: {},
    stats: {}
};

// many params
const queries = {
    count: '',
    data: '',
    facets: {
        facet1: '',
        facet2: ''
    },
    stats: {
        stat1: '',
        stat2: ''
    },

    // only for treatments
    xml: {}
}

// one
const queries = {
    count: '',
    data: '',
    facets: {
        facet1: '',
        facet2: ''
    },
    stats: {
        stat1: '',
        stat2: ''
    },

    // only for treatments
    xml: {},

    relatedRecords: []
}