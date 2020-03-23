'use strict';

const config = require('config');
const plog = require(config.get('plog'));

const qryParts = {
    treatments: {

        one: {

            // data query
            data: {
                pk: 'treatmentId',
                sql: 'SELECT id, treatments.treatmentId, treatmentTitle, doi AS articleDoi, zenodoDep, zoobank, articleTitle, publicationDate, journalTitle, journalYear, journalVolume, journalIssue, pages, authorityName, authorityYear, kingdom, phylum, "order", family, genus, species, status, taxonomicNameLabel, treatments.rank FROM treatments WHERE deleted = 0 AND treatmentId = '
            },

            related: {
                treatmentAuthors: {
                    pk: 'treatmentAuthorId',
                    sql: 'SELECT treatmentAuthorId, treatmentAuthor AS author FROM treatmentAuthors WHERE deleted = 0 AND treatmentId = '
                },
            
                bibRefCitations: {
                    pk: 'bibRefCitationId',
                    sql: 'SELECT bibRefCitationId, refString AS citation FROM bibRefCitations WHERE deleted = 0 AND treatmentId = '
                },
                
                materialsCitations: {
                    pk: 'materialsCitationId',
                    sql: 'SELECT materialsCitationId, treatmentId, typeStatus, latitude, longitude FROM materialsCitations WHERE deleted = 0 AND latitude != "" AND longitude != "" AND treatmentId = '
                },
                
                figureCitations: {
                    pk: 'figureCitationId',
                    sql: 'SELECT figureCitationId, captionText, httpUri, thumbnailUri FROM figureCitations WHERE deleted = 0 AND treatmentId = '
                }
            }

        },

        many: {

            // data queries
            data: {
                pk: 'treatmentId',
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
                    where: [
                        'collectionCode != ""',
                        'materialsCitations.deleted = 0',
                        'treatments.deleted = 0'
                    ],
                    group: ['collectionCode']
                }

            }
        }

        

    },

    treatmentAuthors: {

        one: {

            // data query
            data: {
                pk: 'treatmentAuthorId',
                sql: 'SELECT treatmentAuthorId, treatmentId, treatmentAuthor FROM treatmentAuthors WHERE treatmentAuthorId = '
            },

            related: {
                treatments: {
                    pk: 'treatmentId',
                    sql: 'SELECT t.id, t.treatmentId, t.treatmentTitle, authorityName || ". " || authorityYear || ". <i>" || articleTitle || ".</i> " || journalTitle || ", " || journalYear || ", pp. " || pages || ", vol. " || journalVolume || ", issue " || journalIssue AS context FROM treatments t JOIN treatmentAuthors a ON t.treatmentId = a.treatmentId WHERE a.treatmentAuthorId = '
                }
            }

        },

        many: {

            // data queries
            data: {
                pk: 'treatmentId',
                columns: ['treatmentAuthorId', 'treatmentId', 'treatmentAuthor'],
                tables: ['treatmentAuthors'],
                where: ['treatmentAuthor LIKE @q'],
                sortBy: {
                    columns: [],
                    defaultSort: { col: '', dir: '' }
                }
            },

            // count query
            count: {
                columns: ['Count(*) as numOfRecords'],
                tables: ['treatmentAuthors'],
                where: ['treatmentAuthor LIKE @q']
            },

            stats: {},
            facets: {}
        }
    },

    figureCitations: {

        one: {

            // data query
            data: {
                pk: 'figureCitationId',
                sql: 'SELECT figureCitationId, treatmentId, captionText, httpUri, thumbnailUri FROM figureCitations WHERE figureCitationId = '
            },

            related: {
                treatments: {
                    pk: 'treatmentId',
                    sql: 'SELECT t.id, t.treatmentId, t.treatmentTitle, authorityName || ". " || authorityYear || ". <i>" || articleTitle || ".</i> " || journalTitle || ", " || journalYear || ", pp. " || pages || ", vol. " || journalVolume || ", issue " || journalIssue AS context FROM treatments t JOIN figureCitations f ON t.treatmentId = f.treatmentId WHERE f.figureCitationId = '
                }
            }

        },

        many: {

            // data queries
            data: {
                pk: 'figureCitationId',
                columns: ['id', 'f.figureCitationId', 'f.treatmentId', 'f.captionText AS context', 'httpUri', 'thumbnailUri'],
                tables: ['figureCitations f', 'vfigureCitations v ON f.figureCitationId = v.figureCitationId'],
                where: ['vfigurecitations MATCH @q'],
                sortBy: {
                    columns: [],
                    defaultSort: { col: '', dir: '' }
                }
            },

            // count query
            count: {
                columns: ['Count(*) as numOfRecords'],
                tables: ['vfigureCitations'],
                where: ['vfigurecitations MATCH @q']
            },

            stats: {},
            facets: {}
        }
    },

    citations: {

        one: {

            // data query
            data: {
                pk: 'bibRefCitationId',
                sql: 'SELECT bibRefCitationId, treatmentId, refString, type, year FROM bibRefCitations WHERE bibRefCitationId = '
            },

            related: {
                treatments: {
                    pk: 'treatmentId',
                    sql: 'SELECT t.id, t.treatmentId, t.treatmentTitle, authorityName || ". " || authorityYear || ". <i>" || articleTitle || ".</i> " || journalTitle || ", " || journalYear || ", pp. " || pages || ", vol. " || journalVolume || ", issue " || journalIssue AS context FROM treatments t JOIN bibRefCitations b ON t.treatmentId = b.treatmentId WHERE b.bibRefCitationId = '
                }
            }

        },

        many: {

            // data queries
            data: {
                pk: 'bibRefCitationId',
                columns: ['id', 'b.bibRefCitationId', 'b.treatmentId', 'b.refString AS context', 'type', 'year'],
                tables: ['bibRefCitations b', 'vbibRefCitations v ON b.bibRefCitationId = v.bibRefCitationId'],
                where: ['vbibRefCitations MATCH @q'],
                sortBy: {
                    columns: [],
                    defaultSort: { col: '', dir: '' }
                }
            },

            // count query
            count: {
                columns: ['Count(*) as numOfRecords'],
                tables: ['vbibRefCitations'],
                where: ['vbibRefCitations MATCH @q']
            },

            stats: {},
            facets: {}
        }
    },

    materialsCitations: {

        one: {

            // data query
            data: {
                pk: 'materialsCitationId',
                sql: 'SELECT materialsCitationId, treatmentId, collectionCode, specimenCountFemale, specimenCountMale, specimenCount, specimenCode, typeStatus, collectingCountry, collectingRegion, collectingMunicipality, collectingCounty, location, locationDeviation, determinerName, collectorName, collectingDate, collectedFrom, collectingMethod, latitude, longitude, elevation, httpUri FROM materialsCitations WHERE materialsCitationId = '
            },

            related: {
                treatments: {
                    pk: 'treatmentId',
                    sql: 'SELECT t.id, t.treatmentId, t.treatmentTitle, authorityName || ". " || authorityYear || ". <i>" || articleTitle || ".</i> " || journalTitle || ", " || journalYear || ", pp. " || pages || ", vol. " || journalVolume || ", issue " || journalIssue AS context FROM treatments t JOIN materialsCitations m ON t.treatmentId = m.treatmentId WHERE m.materialsCitationId = '
                }
            }

        },

        many: {

            // data queries
            data: {
                pk: 'materialsCitationId',
                columns: ['id', 'materialsCitationId', 'treatmentId', 'collectionCode', 'specimenCountFemale', 'specimenCountMale', 'specimenCount', 'specimenCode', 'typeStatus', 'collectingCountry', 'collectingRegion', 'collectingMunicipality', 'collectingCounty', 'location', 'locationDeviation', 'determinerName', 'collectorName', 'collectingDate', 'collectedFrom', 'collectingMethod', 'latitude', 'longitude', 'elevation', 'httpUri'],
                tables: ['materialsCitations'],
                where: ['0=0'],
                sortBy: {
                    columns: [],
                    defaultSort: { col: '', dir: '' }
                }
            },

            // count query
            count: {
                columns: ['Count(*) as numOfRecords'],
                tables: ['materialsCitations'],
                where: ['vbibRefCitations MATCH @q']
            },

            stats: {
                'collection codes': {
                    columns: ['Count(DISTINCT collectionCode) AS "collection codes"'], 
                    tables: ['materialsCitations'],
                    where: ['0=0'],
                },

                'collecting countries': {
                    columns: ['Count(DISTINCT collectingCountry) AS "collecting countries"'], 
                    tables: ['materialsCitations'],
                    where: ['0=0'],
                },

                'female specimens': {
                    columns: ['Sum(specimenCountFemale) AS "female specimens"'], 
                    tables: ['materialsCitations'],
                    where: ['0=0'],
                },

                'male specimens': {
                    columns: ['Sum(specimenCountMale) AS "male specimens"'], 
                    tables: ['materialsCitations'],
                    where: ['0=0'],
                },

                specimens: {
                    columns: ['Sum(specimenCount) AS specimens'], 
                    tables: ['materialsCitations'],
                    where: ['0=0'],
                }
            },

            facets: {}
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

const calcSortParams2 = function(sortBy, queryObject) {
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


//const calcQuery2 = function(columns, constraint, tables, queryObject) {
const calcQuery = function(query, resource, queryObject) {

    const pk = resource.pk;
    const queryable = resource.queryable;

    const equal = queryable.equal;
    const equalKeys = Object.keys(equal);

    const like = queryable.like;
    const likeKeys = Object.keys(like);

    const match = queryable.match;
    const matchKeys = Object.keys(match);
    
    const columns = resource.queries[query].columns;
    const tables = resource.queries[query].tables;
    const constraint = resource.queries[query].constraint;
    const sortBy = resource.queries[query].sortBy;
    const group = resource.queries[query].group;

    for (let k in queryObject) {
        if (! exclude.includes(k)) {
            
            if (equalKeys.includes(k)) {
                if (equal[k]) {
                    constraint.push(`${equal[k]} = ${queryObject[k]}`);
                }
                else {
                    constraint.push(`${k} = ${queryObject[k]}`);
                }
            }
            else if (likeKeys.includes(k)) {
                if (like[k]) {
                    constraint.push(`${Lower(like[k])} LIKE ${queryObject[k].toLowerCase()}`);
                }
                else {
                    constraint.push(`Lower(${k}) LIKE ${queryObject[k].toLowerCase()}`);
                }
            }
            else if (matchKeys.includes(k)) {
                tables.push(match[k].table);

                if (match[k]) {
                    constraint.push(`${match[k].column} MATCH ${queryObject[k]}`);
                }
                else {
                    constraint.push(`${k} MATCH ${queryObject[k]}`);
                }
            }
        }
    }

    return `SELECT ${columns.join(' ')} FROM ${tables.join(' ')} WHERE ${constraint.join(' AND ')}`;
};

const makeQueries = function({qryType, qrySource, queryObject, plugins}) {

    const resources = plugins._resources;
    const columns = JSON.parse(JSON.stringify(qrySource.columns));
    const tables = JSON.parse(JSON.stringify(qrySource.tables));
    const where = JSON.parse(JSON.stringify(qrySource.where));
    const whereLog = JSON.parse(JSON.stringify(qrySource.where));

    let sortcol = '';
    let sortdir = '';

    // the following params are valid in the URL but are not used 
    // for actually constructing the SQL query
    const invalidParams = ['resources', 'communities', 'facets', 'page', 'size', 'stats', 'xml', 'limit', 'offset'];

    for (let key in queryObject) {
        if (! invalidParams.includes(key)) {
            if (key === 'sortBy') {

                // sortby is *only* applicable when the query is for data
                if (qryType === 'data') {
                    [sortcol, sortdir] = calcSortParams(qrySource, queryObject);
                }
            }
            else if (key === 'q') {

                if (resources === 'treatments') {

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

            }
            else if (key === 'order') {
                where.push(`"${key}" = @${key}`)
                whereLog.push(`"${key}" = "${queryObject[key]}"`);
            }
            else {
                where.push(`${key} = @${key}`)
                whereLog.push(`${key} = "${queryObject[key]}"`);
            }
        }
    }

    let query = `SELECT ${columns.join(', ')} FROM ${tables.join(' JOIN ')} WHERE ${where.join(' AND ')}`;
    let queryLog = `SELECT ${columns.join(', ')} FROM ${tables.join(' JOIN ')} WHERE ${whereLog.join(' AND ')}`;

    // if ('order' in queryObject) {
    //     console.log('sql :' + query);
    //     console.log('sqlLog :' + queryLog);
    // }

    if (qryType === 'data') {
        if (queryObject.sortby) {
            query += ` ORDER BY ${sortcol} ${sortdir}`;
            queryLog += ` ORDER BY ${sortcol} ${sortdir}`;
        }

        query += ` LIMIT @limit OFFSET @offset`;
        queryLog += ` LIMIT ${queryObject.limit} OFFSET ${queryObject.offset}`;
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

const qm = function(queryObject, plugins) {

    // queries{} holds the SQL with bind @params that is actually
    // used by the databse. queriesLog{} is the same query but 
    // with the actual params, and is used only to write out the logs
    const queries = {};
    const queriesLog = {};

    // resources: treatments, treatmentAuthors
    const resources = plugins._resources;

    let qryNum = 'many';

    // check if the PK exists in the queryObject. If there is a PK
    // then the query is for a specific record
    if (queryObject[plugins._resourceId]) {
        qryNum = 'one';
    }

    // validQryTypes: data, count, stats, facets, related
    const validQryTypes = Object.keys(qryParts[resources][qryNum]);

    let i = 0;
    const j = validQryTypes.length;

    for (; i < j; i++) {

        // the current qryType: data OR count OR stats, etc.
        const qryType = validQryTypes[i];

        if (qryType === 'related' || qryType === 'stats' || qryType === 'facets') {

            // because these queries are really a bunch of queries,
            // they are grouped into a hash in queries{} and queriesLog()
            queries[qryType] = {};
            queriesLog[qryType] = {};

            // the actual queries from 'related'
            const qryGroup = qryParts[resources][qryNum][qryType];
            
            for (let qry in qryGroup) {

                if (qryNum === 'one') {
                    queries[qryType][qry] = {
                        pk: qryGroup[qry].pk,
                        sql: qryGroup[qry].sql + `@${plugins._resourceId}`
                    };
    
                    queriesLog[qryType][qry] = {
                        pk: qryGroup[qry].pk,
                        sql: qryGroup[qry].sql + `"${queryObject[plugins._resourceId]}"`
                    };
                }
                else {

                    // none or more parameters have been submitted for the query, but 
                    // not the PK. So we have to construct the queries to be run.
                    //
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

                    // qrySource is the set of columns, tables, where, and 
                    // optionally group used to construct the query
                    const qrySource = qryGroup[qry];

                    const [query, queryLog] = makeQueries({qryType, qrySource,  queryObject, plugins});
                    queries[qryType][qry] = query;
                    queriesLog[qryType][qry] = queryLog;
                }
                
            }
            

        }
        else {

            const qryGroup = qryParts[resources][qryNum][qryType];

            if (qryNum === 'one') {
                queries[qryType] = {
                    pk: qryGroup.pk,
                    sql: qryGroup.sql + `@${plugins._resourceId}`
                };
                queriesLog[qryType] = {
                    pk: qryGroup.pk,
                    sql: qryGroup.sql + `"${queryObject[plugins._resourceId]}"`
                };
            }
            else {
                const qrySource = qryParts[resources].many[qryType];

                const [query, queryLog] = makeQueries({qryType, qrySource, queryObject, plugins});
                queries[qryType] = query;
                queriesLog[qryType] = queryLog;
            }
            
        }
    }

    return [queries, queriesLog];

};

const exclude = ['resources', 'communities', 'facets', 'page', 'size', 'stats', 'xml', 'limit', 'offset', 'refreshCache'];

const qParts = {
    treatments: {
        pk: 'treatmentId',
        queryable: {
            equal: {
                publicationDate: '', 
                journalYear: '', 
                journalVolume: '', 
                journalIssue: '', 
                authorityYear: '', 
                kingdom: '', 
                phylum: '', 
                '"order"': '', 
                family: '', 
                genus: '', 
                species: '', 
                status: '', 
                'treatments.rank': ''
            },
            like: {
                treatmentTitle: '', 
                articleTitle: '', 
                journalTitle: '', 
                authorityName: '', 
                taxonomicNameLabel: ''
            },
            match: {
                q: { column: 'vtreatments', table: 'JOIN vtreatments ON treatments.treatmentId = vtreatments.treatmentId' }
            }
        },
        queries: {
            count: {
                columns: ['count(*) as num'],
                tables: ['treatments'],
                constraint: ['treatments.deleted = 0'],
                sortBy: {},
                group: [],

                fn: function(resource, queryObject) {

                    
                    //calcQuery(this.columns, this.constraint, this.tables, queryObject);
                    const query = calcQuery('count', resource, queryObject);
                    return query;
                    //return `SELECT ${this.columns.toReturn.join(' ')} FROM ${this.tables.join(' ')} WHERE ${this.constraint.join(' AND ')}`;
                }
            },

            // data: {
            //     columns: {
            //         toReturn: ['id', 'treatments.treatmentId', 'treatmentTitle', 'doi AS articleDoi', 'zenodoDep', 'zoobank', 'articleTitle', 'publicationDate', 'journalTitle', 'journalYear', 'journalVolume', 'journalIssue', 'pages', 'authorityName', 'authorityYear', 'kingdom', 'phylum', '"order"', 'family', 'genus', 'species', 'status', 'taxonomicNameLabel', 'treatments.rank'],
            //         // queryable: {
            //         //     equal: {
            //         //         publicationDate: '', 
            //         //         journalYear: '', 
            //         //         journalVolume: '', 
            //         //         journalIssue: '', 
            //         //         authorityYear: '', 
            //         //         kingdom: '', 
            //         //         phylum: '', 
            //         //         '"order"': '', 
            //         //         family: '', 
            //         //         genus: '', 
            //         //         species: '', 
            //         //         status: '', 
            //         //         'treatments.rank': ''
            //         //     },
            //         //     like: {
            //         //         treatmentTitle: '', 
            //         //         articleTitle: '', 
            //         //         journalTitle: '', 
            //         //         authorityName: '', 
            //         //         taxonomicNameLabel: ''
            //         //     },
            //         //     match: {
            //         //         q: { column: 'vtreatments', table: 'JOIN vtreatments ON treatments.treatmentId = vtreatments.treatmentId' }
            //         //     }
            //         // }
            //     },
            //     tables: ['treatments'],
            //     constraint: ['treatments.deleted = 0'],
            //     sortBy: {
            //         columns: ['journalYear'],
            //         defaultSort: {
            //             col: 'journalYear',
            //             dir: 'ASC'
            //         }
            //     },
            //     group: [],

            //     fn: function(queryObject) {
            //         calcQuery(this.columns, this.constraint, this.tables, queryObject);

            //         // now, figure out the sort params
            //         const [sortcol, sortdir] = calcSortParams2(this.sortBy, queryObject)

            //         return `SELECT ${this.columns.toReturn.join(' ')} FROM ${this.tables.join(' ')} WHERE ${this.constraint.join(' AND ')} ORDER BY ${sortcol} ${sortdir}`;
            //     }
            // },
            related: {},
            stats: {},
            facets: {

                journalTitle: {
                    columns: {
                        toReturn: ['journalTitle', 'Count(journalTitle) AS c'],
                        // queryable: {
                        //     equal: {
                        //         publicationDate: '', 
                        //         journalYear: '', 
                        //         journalVolume: '', 
                        //         journalIssue: '', 
                        //         authorityYear: '', 
                        //         kingdom: '', 
                        //         phylum: '', 
                        //         '"order"': '', 
                        //         family: '', 
                        //         genus: '', 
                        //         species: '', 
                        //         status: '', 
                        //         'treatments.rank': ''
                        //     },
                        //     like: {
                        //         treatmentTitle: '', 
                        //         articleTitle: '', 
                        //         journalTitle: '', 
                        //         authorityName: '', 
                        //         taxonomicNameLabel: ''
                        //     },
                        //     match: {
                        //         q: { column: 'vtreatments', table: 'JOIN vtreatments ON treatments.treatmentId = vtreatments.treatmentId' }
                        //     }
                        // }
                    },
                    tables: ['treatments'],
                    constraint: ["treatments.deleted = 0 AND journalTitle != ''"],
                    sortBy: {},
                    group: ['journalTitle'],

                    fn: function(queryObject) {
                        calcQuery(this.columns, this.constraint, this.tables, queryObject);

                        return `SELECT ${this.columns.toReturn.join(' ')} FROM ${this.tables.join(' ')} WHERE ${this.constraint.join(' AND ')}`;
                    }
                },

                // journalYear: {
                //     columns: ['journalYear', 'Count(journalYear) AS c'],
                //     tables: ['treatments'],
                //     where: ["treatments.deleted = 0 AND journalYear != ''"],
                //     group: ['journalYear']
                // },

                // status: {
                //     columns: ['status', 'Count(status) AS c'],
                //     tables: ['treatments'],
                //     where: ["treatments.deleted = 0 AND status != ''"],
                //     group: ['status']
                // },
                
                // rank: {
                //     columns: ['treatments.rank', 'Count(treatments.rank) AS c'],
                //     tables: ['treatments'],
                //     where: ['treatments.deleted = 0', 'treatments.rank != ""'],
                //     group: ['treatments.rank']
                // },

                // collectionCode: {
                //     columns: ['collectionCode', 'Count(collectionCode) AS c'],
                //     tables: ['materialsCitations', 'treatments ON materialsCitations.treatmentId = treatments.treatmentId'],
                //     where: [
                //         'collectionCode != ""',
                //         'materialsCitations.deleted = 0',
                //         'treatments.deleted = 0'
                //     ],
                //     group: ['collectionCode']
                // }
            }
        }
    }
}

// A query is made up of seven parts
//
// three mandatory parts
// -----------------------------
// SELECT <columns> 
// FROM <tables> 
// WHERE <constraint> 
//
// four optional parts
// -----------------------------
// GROUP BY <group>
// ORDER BY <sortcol> <sortdir> 
// LIMIT <limit> 
// OFFSET <offset>
const make = function(queryObject) {

    // get a reference to the resource-specific query parts
    const resource = qParts[queryObject.resources];

    // make a deep copy of the resource specific queries
    // so it is easier to work with them. We make a deep 
    // copy because the query parts will be modified based 
    // on the parameters passed in the querystring, and 
    // we want to retain the original query parts.
    const queries = {};
    for (let q in resource.queries) {
        queries[q] = resource.queries[q];
    }

    plog.info('resource', queryObject.resources);

    for (let queryName in queries) {

        if (queryName === 'facets' || queryName === 'stats' || queryName === 'related') {
            // const queries = {};
            // for (let q in resource.queries[queryName]) {
            //     queries[q] = resource.queries[queryName][q];
            // }

            // const queryGroup = queryName;
            // for (let queryName in queries) {
            //     const query = queries[queryName].fn(queryObject);
            //     plog.info(`QUERY ${queryGroup.toUpperCase()} ${queryName}`, query);
            // }
        }
        else {
            const query = queries[queryName].fn(resource, queryObject);
            plog.info(`QUERY ${queryName}`, query);
        }
        
    }
};

make({
    communities: ['biosyslit', 'belgiumherbarium'],
    refreshCache: false,
    page: 1,
    size: 30,
    resources: 'treatments',
    facets: true,
    stats: false,
    xml: false,
    sortBy: 'journalYear:ASC',
    q: 'carabus',
    // creator: 'Agosti',
    // treatmentId: 'sfwesdfs'
})

module.exports = qm;