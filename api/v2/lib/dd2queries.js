'use strict';

/***********************************************************************
 * 
 * Here we use the combined and flatened data dictionary to generate all 
 * the SQL queries required to extract data from the db based on the 
 * supplied queryObject 
 * 
 **********************************************************************/

const config = require('config');
const plog = require(config.get('plog'));


const dd2queries = function(queryObject) {

    // get a reference to the resource-specific query parts.
    // For example, if 'queryObject.resource' is 'treatments'
    // then 'r' will be a reference to the 'treatments'
    // specific qParts
    const qParts = require('./qparts');
    const r = qParts[queryObject.resource];

    // see `getDdKey()` below for details on what it is and 
    // and why we need it
    const ddKeys = getDdKeys();

    // Now we can determine whether or not a PK is included in the 
    // queryObject …
    const pk = ddKeys.byResourceIds[queryObject.resource];

    // and whether or not there are additional constraints and tables 
    // tables to be joined
    const [ matchTables, additionalConstraint ] = calcConstraint(ddKeys, queryObject);

    // make a deep copy of the resource specific queries
    // so it is easier to work with them. We make a deep 
    // copy because the query parts will be modified based 
    // on the parameters passed in the querystring, and 
    // we want to retain the original query parts.
    const queries = JSON.parse(JSON.stringify(r.queries));

    const doGroups = ['essential'];

    // if a PK is present in the querystring then we need to get the 
    // related records and, if the resource is treatments, then the 
    // taxonsStats
    if (queryObject[pk]) {
        
        doGroups.push(...[ 'related', 'taxonStats' ]);
    }

    // if there is no PK, then we need to get facets and state
    // if they have been requested
    else {
        
        if (queryObject.facets) doGroups.push('facets');
        if (queryObject.stats) doGroups.push('stats');
    }

    const q = {};

    for (let queryGroup in queries) {
    
        if (doGroups.includes(queryGroup)) {
            const groupQueries = queries[queryGroup];

            q[queryGroup] = {};

            for (let queryName in groupQueries) {
                const query = groupQueries[queryName];

                const sql = calcQuery(
                    ddKeys, 
                    queryGroup, 
                    query, 
                    queryObject, 
                    matchTables, 
                    additionalConstraint
                );

                q[queryGroup][queryName] = { sql: sql };
                if ('pk' in query) {

                    q[queryGroup][queryName].pk = query.pk;
                }
            }
        }
        
    }

    return q;
};

// We go through the data dictionary and create a data structure that
// groups various keys of a resource field by the related query string 
// param submitted via a REST API. There is another grouping that helps 
// doing a quick look up of the resourceID key for a given resource, 
// for example, 'treatmentId' for 'treatments'. This is how ddKeys looks
//
// "byQueryString": {
//     "treatments": {
//       "treatmentId": {
//         "sqlName": "treatmentId",
//         "queryable": "equal",
//         "table": false,
//         "resourceId": "treatmentId"
//       },
//       "treatmentTitle": {
//         "sqlName": "treatmentTitle",
//         "queryable": "like",
//         "table": false,
//         "resourceId": false
//       },
//       … other fields …
//     },
//     … other resources …
//   },
//   "byResourceIds": {
//     "treatments": "treatmentId",
//     "figureCitations": "figureCitationId",
//     "bibRefCitations": "bibRefCitationId",
//     "treatmentCitations": "treatmentCitationId",
//     "materialsCitations": "materialsCitationId",
//     "treatmentAuthors": "treatmentAuthorId",
//     "images": "id",
//     "publications": "id"
//   }
const getDdKeys = function() {
    
    const byQueryString = {};
    const byResourceIds = {};

    const { dataDictionary } = require('./dd2datadictionary');
    
    for (let resource in dataDictionary) {

        // resource-specific data dictionary
        const rdd = dataDictionary[resource];

        byQueryString[resource] = {};

        for (let i = 0, j = rdd.length; i < j; i++) {

            const f = rdd[i];            
            const qs = f.queryString;
            
            if (qs) {

                byQueryString[resource][qs] = {
                    sqlName: f.sqlName || qs,
                    queryable: f.queryable,
                    table: f.table || false,
                    resourceId: f.resourceId ? f.plaziName : false
                }
            }

            if (f.resourceId) {

                byResourceIds[resource] = f.plaziName
            }

        }

    }

    return {
        byQueryString: byQueryString,
        byResourceIds: byResourceIds
    };

};


// We need sort params only for the data query.
// Here we figure out the sortcol and sortdir
const calcSortParams = function(sortBy, queryObject) {

    let [sortcol, sortdir] = queryObject.sortBy.split(':')
        .map((e, i) => { return i > 0 ? e.toUpperCase() : e });

    if (! sortBy.columns.includes(sortcol)) {
        sortcol = sortBy.defaultSort.col;
    }

    if (sortdir !== 'ASC' && sortdir !== 'DESC') {
        sortdir = sortBy.defaultSort.dir
    }

    return [sortcol, sortdir];
};

const calcConstraint = function(ddKeys, queryObject) {
    
    const pk = ddKeys.byResourceIds[queryObject.resource];

    const matchTables = [];
    const constraint = [];

    if (queryObject[pk]) {
        constraint.push(`${pk} = @${pk}`);
    }
    else {
        for (let k in queryObject) {

            const f = ddKeys.byQueryString[queryObject.resource][k];
            
            if (f) {

                const op = f.queryable;
                const sqlName = f.sqlName;

                if (op === 'equal') {
                    constraint.push(`${sqlName} = @${k}`);
                }
                else if (op === 'like') {
                    queryObject[k] = queryObject[k] + '%';
                    if (f.table) {
                        matchTables.push(f.table);
                    }
                    
                    constraint.push(`${sqlName} LIKE @${k}`);
                }
                else if (op === 'match') {
                    matchTables.push(f.table);
                    constraint.push(`${sqlName} MATCH @${k}`);
                }
                else if (op === 'between') {

                    // else if (col === 'lat') {
                    //     cols.push('latitude > @min_latitude');
                    //     cols.push('latitude < @max_latitude');
                    //     queryObject.min_latitude = queryObject.lat - range;
                    //     queryObject.max_latitude = +queryObject.lat + range;
                    // }
                    // else if (col === 'lon') {
                    //     cols.push('longitude > @min_longitude');
                    //     cols.push('longitude < @max_longitude');
                    //     queryObject.min_longitude = queryObject.lon - range;
                    //     queryObject.max_longitude = +queryObject.lon + range;
                    // }

                    const delta = 0.9;
                    queryObject[`min_${k}`] = +queryObject[k] - delta;
                    queryObject[`max_${k}`] = +queryObject[k] + delta;
                    constraint.push(`${sqlName} > @min_${k}`);
                    constraint.push(`${sqlName} < @max_${k}`);
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
const calcQuery = function(ddKeys, queryGroup, query, queryObject, matchTables, additionalConstraint) {
    
    //console.log(additionalConstraint)
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

        if (additionalConstraint.length) {

            constraint.push(...additionalConstraint);
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




const test = function() {

    const q1 = {
        // communities: ['biosyslit', 'belgiumherbarium'],
        // refreshCache: false,
        // page: 1,
        // size: 30,
        resource: 'treatments',
        author: 'fisher',
        // facets: false,
        // stats: false,
        // xml: false,
        // sortBy: 'journalYear:ASC',
        // q: 'carabus',
        // authorityName: 'Agosti',
        // journalYear: '1996',
        // format: 'xml',
        // treatmentTitle: 'opheys',
        // doi: '10.2454/sdff:1956',
        // treatmentId: '58F12CC7CCAD08F32CF9920D36C9992E'
    };

    const lookups = [
        {
            resource: 'authors',
            q: 'ago'
        },
        {
            resource: 'keywords',
            q: 'son'
        },
        {
            resource: 'families',
            q: 'cho'
        },
        {
            resource: 'taxa',
            q: 'tin'
        },
    ];

    console.log(dd2queries(q1));

    lookups.forEach(l => {
        //console.log(dd2queries(l));
    });

};

// https://stackoverflow.com/questions/6398196/detect-if-called-through-require-or-directly-by-command-line?rq=1
if (require.main === module) {
    
    test();
} 
else {
    
    module.exports = dd2queries;
}

