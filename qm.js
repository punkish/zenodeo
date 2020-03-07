'use strict';

const qm = function(queryObject) {

    // A query is made up of six parts
    //
    // mandatory parts
    // -----------------------------
    // SELECT <columns> 
    // FROM <tables> 
    // WHERE <constraint> 
    //
    // optional parts
    // -----------------------------
    // ORDER BY <sortcol> <sortdir> 
    // LIMIT <limit> 
    // OFFSET <offset>

    const qryParts = {
        treatments: {

            // data queries
            data: {
                columns: ['id', 'treatments.treatmentId', 'treatmentTitle', 'doi AS articleDoi', 'zenodoDep', 'zoobank', 'articleTitle', 'publicationDate', 'journalTitle', 'journalYear', 'journalVolume', 'journalIssue', 'pages', 'authorityName', 'authorityYear', 'kingdom', 'phylum', '"order"', 'family', 'genus', 'species', 'status', 'taxonomicNameLabel', 'treatments.rank'],
                tables: ['treatments'],
                where: ['treatments.deleted = 0'],
                sortby: {
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
    
                'figure citations': {
                    columns: ['Count(figureCitationId)'], 
                    tables: ['figureCitations JOIN treatments ON figureCitations.treatmentId = treatments.treatmentId'],
                    where: ["treatments.deleted = 0 AND figureCitations.deleted = 0"]
                }
            },

            facets: {
    
                journalTitle: {
                    columns: ['journalTitle', 'Count(journalTitle) AS c'],
                    tables: ['treatments'],
                    where: ["treatments.deleted = 0 AND journalTitle != ''"]
                },
    
                journalYear: {
                    columns: ['journalYear', 'Count(journalYear) AS c'],
                    tables: ['treatments'],
                    where: ["treatments.deleted = 0 AND journalYear != ''"]
                },
    
                status: {
                    columns: ['status', 'Count(status) AS c'],
                    tables: ['treatments'],
                    where: ["treatments.deleted = 0 AND status != ''"]
                },
                
                rank: {
                    columns: ['treatments.rank', 'Count(treatments.rank) AS c'],
                    tables: ['treatments'],
                    where: ["treatments.deleted = 0 AND treatments.rank != ''"]
                },
    
                collectionCode: {
                    columns: ['collectionCode', 'Count(collectionCode) AS c'],
                    tables: ['materialsCitations JOIN treatments on materialsCitations.treatmentId = treatments.treatmentId'],
                    where: ["treatments.deleted = 0 AND collectionCode != ''"]
                }
    
            }

        }
    };

    const calcSortParams = function(qrySource, queryObject) {
        const sortby = qrySource.sortby.columns;
        const defaultSortCol = qrySource.sortby.defaultSort.col;
        const defaultSortDir = qrySource.sortby.defaultSort.dir;

        let [sortcol, sortdir] = queryObject.sortby.split(':');
        if (! sortby.includes(sortcol)) {
            sortcol = defaultSortCol;
        }

        sortdir = sortdir.toUpperCase();
        if (sortdir !== 'ASC' || sortdir !== 'DESC') {
            sortdir = defaultSortDir
        }

        return [sortcol, sortdir];
    };

    const makeQueries = function(qryType, qrySource, queryObject) {
        const columns = qrySource.columns;
        const tables = qrySource.tables;
        const where = qrySource.where;
        const whereLog = JSON.parse(JSON.stringify(qrySource.where));

        let sortcol = '';
        let sortdir = '';

        for (let key in queryObject) {
            if (key !== 'resource') {
                if (key === 'sortby') {

                    // sortby is *only* applicable when the query is for data
                    if (qryType === 'data') {
                        [sortcol, sortdir] = calcSortParams(qrySource, queryObject);
                    }
                }
                else if (key === 'q') {

                    // when the key is 'q', the fulltext column is returned only for 
                    // the data query. For all other queries, only the tables and 
                    // the where constraint are applied 
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

        return [query, queryLog];
    };
    /******************************************************************************/

    const resource = queryObject.resource;
    const validQryTypes = Object.keys(qryParts[resource]);
    const queries = {};
    const queriesLog = {};

    let i = 0;
    const j = validQryTypes.length;

    for (; i < j; i++) {
        const qryType = validQryTypes[i];
 
        if (qryType === 'stats' || qryType === 'facets') {
            queries[qryType] = {};
            queriesLog[qryType] = {};

            const grpQueries = qryParts[resource][qryType];

            for (let qry in grpQueries) {
                const qrySource = grpQueries[qry];

                const [query, queryLog] = makeQueries(qryType, qrySource, queryObject);
                queries[qryType][qry] = query;
                queriesLog[qryType][qry] = queryLog;
            }


        }
        else {
            const qrySource = qryParts[resource][qryType];

            const [query, queryLog] = makeQueries(qryType, qrySource, queryObject);
            queries[qryType] = query;
            queriesLog[qryType] = queryLog;
        }
        
    }

    console.log('queries');
    console.log('-'.repeat(50));
    console.log(queries);

    console.log('queries log');
    console.log('-'.repeat(50));
    console.log(queriesLog);

};

qm({
    resource: 'treatments',
    journalYear: 1943,
    q: 'maratus',
    sortby: 'a:ASC'
});