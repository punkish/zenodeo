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

const calcConstraint = function(queryObject) {

    const resources = queryObject.resources;
    const pk = ddKeys.byResourceIds[resources];

    const matchTables = [];
    const constraint = [];

    if (queryObject[pk]) {
        constraint.push(`${pk} = @${pk}`);
    }
    else {
        for (let k in queryObject) {
            
            if (! exclude.includes(k)) {
                
                const ddk = ddKeys.byQueryString[resources][k];
                if (ddk) {
                    const op = ddk.queryable;
                    const sqlName = ddk.sqlName;

                    if (op === 'equal') {
                        constraint.push(`${sqlName} = @${k}`);
                    }
                    else if (op === 'like') {
                        queryObject[k] = queryObject[k] + '%';
                        constraint.push(`${sqlName} LIKE @${k}`);
                    }
                    else if (op === 'match') {
                        matchTables.push(ddk.table);
                        constraint.push(`${sqlName} MATCH @${k}`);
                    }
                }
            }
            
        }
    }

    return [ matchTables, constraint ];
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
const calcQuery = function(queryGroup, query, queryObject, matchTables, addedConstraint) {

    const columns = query.columns;
    const tables = JSON.parse(JSON.stringify(query.tables));
    const constraint = JSON.parse(JSON.stringify(query.constraint));

    const sortBy = query.sortBy;
    const group = query.group;

    const pk = ddKeys.byResourceIds[queryObject.resources];

    const pagination = query.pagination;
    const limit = queryObject.limit || query.limit || 0;
    const offset = queryObject.offset || query.offset || 0;
    
    if (matchTables.length) {
        tables.push(...matchTables);
    }

    if (queryGroup !== 'taxonStats' && queryGroup !== 'related') {
        if (addedConstraint.length) {
            constraint.push(...addedConstraint);
        }
    }
    

    let sql = `SELECT ${columns.join(', ')} FROM ${tables.join(' JOIN ')} WHERE ${constraint.join(' AND ')}`;

    // now, figure out the sort params, if applicable
    let [sortcol, sortdir] = ['', ''];
    if (queryObject.sortBy && Object.keys(sortBy).length) {
        [sortcol, sortdir] = calcSortParams(sortBy, queryObject);
        sql += ` ORDER BY ${sortcol} ${sortdir}`;
    }

    if (group && Object.keys(group).length) {
        sql += ` GROUP BY ${group.join(' ')}`;
    }

    if (! queryObject[pk]) {
        if (pagination) {
            if (limit > 0) {
                sql += ' LIMIT @limit OFFSET @offset';
            }
        }
    }

    return sql;
};

const ddKeys = (function() {
    const byQueryString = {};
    const byResourceIds = {};

    for (let resource in dd) {

        byQueryString[resource] = {};

        const resPart = dd[resource];
        for (let i = 0, j = resPart.length; i < j; i++) {
            const qs = resPart[i].queryString;

            if (qs) {

                byQueryString[resource][qs] = {
                    sqlName: resPart[i].sqlName || qs,
                    queryable: resPart[i].queryable,
                    table: resPart[i].table || false,
                    resourceId: resPart[i].resourceId || false
                }

                if (resPart[i].resourceId) {
                    byResourceIds[resource] = resPart[i].plaziName
                }
                
            }
        }

    }

    return {
        byQueryString: byQueryString,
        byResourceIds: byResourceIds
    };
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
    const pk = ddKeys.byResourceIds[resources];

    const [ matchTables, constraint ] = calcConstraint(queryObject);

    // make a deep copy of the resource specific queries
    // so it is easier to work with them. We make a deep 
    // copy because the query parts will be modified based 
    // on the parameters passed in the querystring, and 
    // we want to retain the original query parts.
    const queries = JSON.parse(JSON.stringify(r.queries));

    const queryGroups = {
        PK: [ 'related', 'taxonStats' ],
        notPK: [ 'facets', 'stats' ]
    };

    const doGroups = queryObject[pk] ? queryGroups.PK : queryGroups.notPK;
    doGroups.push('essential');

    const q = {};

    for (let queryGroup in queries) {
    
        if (doGroups.includes(queryGroup)) {
            const groupQueries = queries[queryGroup];

            q[queryGroup] = {};

            for (let queryName in groupQueries) {
                const query = groupQueries[queryName];
                const sql = calcQuery(queryGroup, query, queryObject, matchTables, constraint);

                q[queryGroup][queryName] = { sql: sql };
                if ('pk' in query) {
                    q[queryGroup][queryName].pk = query.pk;
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
//     //sortBy: 'journalYear:ASC',
//     q: 'carabus',
//     authorityName: 'Agosti',
//     journalYear: '1996',
//     format: 'xml',
//     treatmentTitle: 'opheys',
//     doi: '10.2454/sdff:1956',
//     treatmentId: '58F12CC7CCAD08F32CF9920D36C9992E'
// });

// console.log(JSON.stringify(q, null, '\t'))