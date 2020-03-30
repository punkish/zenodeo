'use strict';

const config = require('config');
const plog = require(config.get('plog'));
const qParts = require('./qparts');

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

// The following params may be present in the querystring but they are not included when making the SQL
const exclude = ['resources', 'communities', 'facets', 'page', 'size', 'stats', 'xml', 'limit', 'offset', 'refreshCache', 'resources', 'resourceId'];

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
const calcQuery = function(query, resource, queryObject) {

    const pk = resource.pk;
    const queryable = resource.queryable;

    const equal = queryable.equal;
    const equalKeys = Object.keys(equal);

    const like = queryable.like;
    const likeKeys = Object.keys(like);

    const match = queryable.match;
    const matchKeys = Object.keys(match);
    
    const columns = query.columns;
    const tables = JSON.parse(JSON.stringify(query.tables));
    const constraint = JSON.parse(JSON.stringify(query.constraint));
    const constraintLog = JSON.parse(JSON.stringify(query.constraint));
    const sortBy = query.sortBy;
    const group = query.group;

    const pagination = query.pagination;

    if (queryObject[pk]) {
        constraint.push(`${pk} = @${pk}`);
        constraintLog.push(`${pk} = '${queryObject[pk]}'`);
    }
    else {
        for (let k in queryObject) {
            
            if (! exclude.includes(k)) {
                
                if (equalKeys.includes(k)) {
                    const kk = equal[k] || k;
                    constraint.push(`${kk} = @${k}`);
                    constraintLog.push(`${kk} = '${queryObject[k]}'`);
                }
                else if (likeKeys.includes(k)) {
                    const kk = like[k] || k;
                    
                    constraint.push(`${kk} LIKE @${k}`);
                    constraintLog.push(`${kk} LIKE '${queryObject[k].toLowerCase()}'`);
                }
                else if (matchKeys.includes(k)) {
                    tables.push(match[k].table);

                    if (match[k]) {
                        constraint.push(`${match[k].column} MATCH @${k}`);
                        constraintLog.push(`${match[k].column} MATCH '${queryObject[k]}'`);
                    }
                    else {
                        constraint.push(`${k} MATCH @${k}`);
                        constraintLog.push(`${k} MATCH '${queryObject[k]}'`);
                    }
                }
            }
            
        }
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

const qm = {

    getSql: function(queryObject) {

        //plog.info('queryObject - getSql', JSON.stringify(queryObject));

        // get a reference to the resource-specific query parts.
        // For example, if 'queryObject.resources' is 'treatments'
        // then 'resource' will be a reference to the 'treatments'
        // specific qParts
        const resource = qParts[queryObject.resources];
        const pk = resource.pk;
    
        // make a deep copy of the resource specific queries
        // so it is easier to work with them. We make a deep 
        // copy because the query parts will be modified based 
        // on the parameters passed in the querystring, and 
        // we want to retain the original query parts.
        const queries = JSON.parse(JSON.stringify(resource.queries));
        // plog.info('resource', queryObject.resources);
        // console.log('-'.repeat(100));
    
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
                    const [sql, sqlLog] = calcQuery(query, resource, queryObject);
                    //plog.info(`${queryGroup.toUpperCase()} ${queryName}`, sqlLog);
                    q.queries[queryGroup][queryName] = { sql: sql };
                    q.queriesLog[queryGroup][queryName] = { sql: sqlLog };
                    if ('pk' in query) {
                        q.queries[queryGroup][queryName].pk = query.pk;
                    }
                    
                }
            }
            
        }

        return q;
    
    },

    test: {
        params: [{
            communities: ['biosyslit', 'belgiumherbarium'],
            refreshCache: false,
            page: 1,
            size: 30,
            resources: 'treatments',
            facets: false,
            stats: false,
            xml: false,
            sortBy: 'journalYear:ASC',
            q: 'carabus',
            authorityName: 'Agosti',
            journalYear: '1996',
        },{
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
            authorityName: 'Agosti',
            journalYear: '1996',
        },{
            communities: ['biosyslit', 'belgiumherbarium'],
            refreshCache: false,
            page: 1,
            size: 30,
            resources: 'treatments',
            facets: false,
            stats: true,
            xml: false,
            sortBy: 'journalYear:ASC',
            q: 'carabus',
            authorityName: 'Agosti',
            journalYear: '1996',
        },{
            communities: ['biosyslit', 'belgiumherbarium'],
            refreshCache: false,
            page: 1,
            size: 30,
            resources: 'treatments',
            facets: true,
            stats: true,
            xml: false,
            sortBy: 'journalYear:ASC',
            q: 'carabus',
            authorityName: 'Agosti',
            journalYear: '1996',
        },{
            communities: ['biosyslit', 'belgiumherbarium'],
            refreshCache: false,
            page: 1,
            size: 30,
            resources: 'treatments',
            treatmentId: 'TREATMENTID'
        },{
            communities: ['biosyslit', 'belgiumherbarium'],
            refreshCache: false,
            page: 1,
            size: 30,
            resources: 'treatments',
            facets: true,
            stats: true,
            xml: false,
            sortBy: 'journalYear:ASC',
            q: 'carabus',
            authorityName: 'Agosti',
            journalYear: '1996',
            treatmentId: 'TREATMENTID'
        }]
    }
};

module.exports = qm;