'use strict';

const config = require('config');
const plog = require(config.get('plog'));
const qParts = require('./qparts');
const dd = require('../../../dataDictionary/dd');

// The following params may be present in the querystring but they are 
// not included when making the SQL
const exclude = ['resources', 'communities', 'facets', 'page', 'size', 'stats', 'xml', 'limit', 'offset', 'refreshCache', 'resources', 'resourceId'];

// We need sort params only for the data query.
// Here we figure out the sortcol and sortdir
const calcSortParams = function(sortBy, queryObject) {

    let [sortcol, sortdir] = queryObject.sortBy.split(':')
        .map((e, i) => { return i > 0 ? e.toUpperCase() : e });

    if (! sortBy.columns.includes(sortcol)) {
        sortcol = sortBy.defaultSort.col;
    }

    if (sortdir !== 'ASC' || sortdir !== 'DESC') {
        sortdir = sortBy.defaultSort.dir
    }

    return [sortcol, sortdir];
};

const calcConstraint = function(pk, queryObject) {

    const resource = queryObject.resources;

    // const tables = JSON.parse(JSON.stringify(query.tables));
    // const constraint = JSON.parse(JSON.stringify(query.constraint));
    // const constraintLog = JSON.parse(JSON.stringify(query.constraint));
    const matchTables = [];
    const constraint = [];
    const constraintLog = [];

    if (queryObject[pk]) {
        constraint.push(`${pk} = @${pk}`);
        constraintLog.push(`${pk} = '${queryObject[pk]}'`);
    }
    else {
        for (let k in queryObject) {
            
            if (! exclude.includes(k)) {
                
                const ddk = ddByKeys[resource][k];
                if (ddk) {
                    const op = ddk.queryable;
                    const sqlName = ddk.sqlName;

                    if (op === 'equal') {
                        constraint.push(`${sqlName} = @${k}`);
                        constraintLog.push(`${sqlName} = '${queryObject[k]}'`);
                    }
                    else if (op === 'like') {
                        queryObject[k] = queryObject[k] + '%';
                        constraint.push(`${sqlName} LIKE @${k}`);
                        constraintLog.push(`${sqlName} LIKE '${queryObject[k].toLowerCase()}'`);
                    }
                    else if (op === 'match') {
                        matchTables.push(ddk.table);
                        constraint.push(`${sqlName} MATCH @${k}`);
                        constraintLog.push(`${sqlName} MATCH '${queryObject[k]}'`);
                    }
                }
            }
            
        }
    }

    return [matchTables, constraint, constraintLog];
};

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
const calcQuery = function(query, pk, queryObject, matchTables, constraint, constraintLog) {

    // const resource = queryObject.resources;

    const columns = query.columns;
    const tables = JSON.parse(JSON.stringify(query.tables));
    // const constraint = JSON.parse(JSON.stringify(query.constraint));
    // const constraintLog = JSON.parse(JSON.stringify(query.constraint));
    const sortBy = query.sortBy;
    const group = query.group;

    const pagination = query.pagination;

    // if (queryObject[pk]) {
    //     constraint.push(`${pk} = @${pk}`);
    //     constraintLog.push(`${pk} = '${queryObject[pk]}'`);
    // }
    // else {
    //     for (let k in queryObject) {
            
    //         if (! exclude.includes(k)) {
                
    //             const ddk = ddByKeys[resource][k];
    //             if (ddk) {
    //                 const op = ddk.queryable;
    //                 const sqlName = ddk.sqlName;

    //                 if (op === 'equal') {
    //                     constraint.push(`${sqlName} = @${k}`);
    //                     constraintLog.push(`${sqlName} = '${queryObject[k]}'`);
    //                 }
    //                 else if (op === 'like') {
    //                     queryObject[k] = queryObject[k] + '%';
    //                     constraint.push(`${sqlName} LIKE @${k}`);
    //                     constraintLog.push(`${sqlName} LIKE '${queryObject[k].toLowerCase()}'`);
    //                 }
    //                 else if (op === 'match') {
    //                     tables.push(ddk.table);
    //                     constraint.push(`${sqlName} MATCH @${k}`);
    //                     constraintLog.push(`${sqlName} MATCH '${queryObject[k]}'`);
    //                 }
    //             }
    //         }
            
    //     }
    // }

    if (matchTables.length) {
        tables.push(...matchTables);
    }

    let sql = `SELECT ${columns.join(', ')} FROM ${tables.join(' JOIN ')} WHERE ${constraint.join(' AND ')}`;
    let sqlLog = `SELECT ${columns.join(', ')} FROM ${tables.join(' JOIN ')} WHERE ${constraintLog.join(' AND ')}`;

    // now, figure out the sort params, if applicable
    let [sortcol, sortdir] = ['', ''];
    if (queryObject.sortBy && Object.keys(sortBy).length) {
        [sortcol, sortdir] = calcSortParams(sortBy, queryObject);
        sql += ` ORDER BY ${sortcol} ${sortdir}`;
        sqlLog += ` ORDER BY ${sortcol} ${sortdir}`;
    }

    if (group && Object.keys(group).length) {
        sql += ` GROUP BY ${group.join(' ')}`;
        sqlLog += ` GROUP BY ${group.join(' ')}`;
    }

    if (! queryObject[pk]) {
        if (pagination) {
            sql += ' LIMIT @limit OFFSET @offset';
            sqlLog += ` LIMIT ${queryObject.limit} OFFSET ${queryObject.offset}`;
        }
    }

    return [sql, sqlLog];
};

const ddByKeys = (function() {
    const ddByKeys = {};

    for (let resource in dd) {

        ddByKeys[resource] = {};

        const resPart = dd[resource];
        for (let i = 0, j = resPart.length; i < j; i++) {
            const qs = resPart[i].queryString;
            if (qs) {
                ddByKeys[resource][qs] = {
                    sqlName: resPart[i].sqlName || qs,
                    queryable: resPart[i].queryable,
                    table: resPart[i].table || false
                }
            }
        }

    }

    return ddByKeys;
})();

const dd2queries = function(queryObject) {

    plog.info('queryObject', JSON.stringify(queryObject));

    // for what resource are we creating the queries
    const resources = queryObject.resources;

    // get a reference to the resource-specific query parts.
    // For example, if 'queryObject.resources' is 'treatments'
    // then 'r' will be a reference to the 'treatments'
    // specific qParts
    const r = qParts[resources];
    const pk = r.pk;

    const [matchTables, constraint, constraintLog] = calcConstraint(pk, queryObject);

    // make a deep copy of the resource specific queries
    // so it is easier to work with them. We make a deep 
    // copy because the query parts will be modified based 
    // on the parameters passed in the querystring, and 
    // we want to retain the original query parts.
    const queries = JSON.parse(JSON.stringify(r.queries));

    const queryGroups = {
        PK: ['related'],
        notPK: ['facets', 'stats']
    };

    const doGroups = queryObject[pk] ? queryGroups.PK : queryGroups.notPK;
    doGroups.push('essential');

    const q = {
        queries: {},
        queriesLog: {}
    };

    for (let queryGroup in queries) {
    
        if (doGroups.includes(queryGroup)) {
            const groupQueries = queries[queryGroup];

            q.queries[queryGroup] = {};
            q.queriesLog[queryGroup] = {};

            for (let queryName in groupQueries) {
                const query = groupQueries[queryName];
                const [sql, sqlLog] = calcQuery(query, pk, queryObject, matchTables, constraint, constraintLog);

                q.queries[queryGroup][queryName] = { sql: sql };
                q.queriesLog[queryGroup][queryName] = { sql: sqlLog };
                if ('pk' in query) {
                    q.queries[queryGroup][queryName].pk = query.pk;
                }
            }
        }
        
    }

    return q;
};

module.exports = dd2queries;

// const so = dd2schema();
// const q = dd2queries({
//     communities: ['biosyslit', 'belgiumherbarium'],
//     refreshCache: false,
//     page: 1,
//     size: 30,
//     resources: 'treatments',
//     facets: true,
//     stats: true,
//     xml: false,
//     sortBy: 'journalYear:ASC',
//     q: 'carabus',
//     // authorityName: 'Agosti',
//     // journalYear: '1996',
//     format: 'xml',
//     treatmentTitle: 'opheys',
//     doi: '10.2454/sdff:1956'
// });