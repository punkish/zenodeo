'use strict';

const Wreck = require('@hapi/wreck');

const config = require('config');
const plog = require(config.get('plog'));
const cacheOn = config.get('v2.cache.on');
const Database = require('better-sqlite3');
const dbFacets = new Database(config.get('data.facets'));
const dbTreatments = new Database(config.get('data.treatments'));
const dbQueries = new Database(config.get('data.queries'));

const facets = {
    authors: 'author',
    families: 'family',
    keywords: 'keyword',
    taxa: 'taxon'
};

// Modify the string prototype to mimic strfmt() so SQL statements
// can be sent back in debug or printed to the console with all the 
// parameters visible. See the following SO link for details.
// https://stackoverflow.com/a/18234317/183692
String.prototype.formatUnicorn = String.prototype.formatUnicorn || function () {
    "use strict";
    var str = this.toString();
    if (arguments.length) {
        var t = typeof arguments[0];
        var key;
        var args = ("string" === t || "number" === t) ?
            Array.prototype.slice.call(arguments)
            : arguments[0];

        for (key in args) {
            str = str.replace(new RegExp("\\{" + key + "\\}", "gi"), args[key]);
        }
    }

    return str;
}

module.exports = {

    dataForDelivery: function(t, data, debug) {

        if (cacheOn) {
            return data;
        }
        else {
            const report = { msec: t.msr }
    
            if (process.env.NODE_ENV !== 'production') {
                report.debug = debug;
            }
    
            const {queryObject, sqls} = debug;
            const inserts = sqls.length;
    
            const s1 = dbQueries.prepare(`INSERT INTO webqueries (qp) VALUES(@qp) ON CONFLICT(qp) DO UPDATE SET count=count+1`);
    
            const s2 = dbQueries.prepare('SELECT Max(id) AS id FROM webqueries');
    
            const s3 = dbQueries.prepare(`INSERT INTO sqlqueries (sql) VALUES(@sql) ON CONFLICT(sql) DO NOTHING`);
    
            const s4 = dbQueries.prepare('SELECT Max(id) AS id FROM sqlqueries');
    
            const s5 = dbQueries.prepare('INSERT INTO stats (webqueries_id, sqlqueries_id, timeTaken) VALUES (@webqueries_id, @sqlqueries_id, @timeTaken)');
    
            if (inserts) {
    
                try {
                    //dbQueries.prepare('BEGIN TRANSACTION').run();
    
                    const qp = JSON.stringify(queryObject);
                    s1.run({qp: qp});
    
                    const webqueries_id = s2.get().id;
    
                    for (let i = 0; i < inserts; i++) {
    
                        const sql = sqls[i].sql.formatUnicorn(queryObject);
                        const t = sqls[i].took;
            
                        s3.run({sql: sql});
                        
                        const sqlqueries_id = s4.get().id;
        
                        s5.run({
                            webqueries_id: webqueries_id, 
                            sqlqueries_id: sqlqueries_id, 
                            timeTaken: t.msr
                        });
    
                    }
                }
                catch (error) {
                    console.log(error);
                }
                
            }
    
            return {
                value: data,
                cached: null,
                report: report
            }
        }
    
    },

    // See String.prototype.formatUnicorn above
    strfmt: function(str, data) {
        return str
            .replace(/@(\w+)/g, "'{\$1}'")
            .formatUnicorn(data);
    },
    
    timerFormat: function(t) {

        const [s, ns] = t;

        let ms = ns / 1000000;
        const msr = Math.round(ms);

        let str;
        if (ms >= 1000) {
            s = s + Math.round(ms / 1000);
            str = `${s}s ${ms - (s * 1000)}ms`;
        }
        else {
            str = `${msr}ms`
        }

        return { msr: msr, str: str}
    },

    find: function(pattern, source) {
        return dbFacets.prepare(`SELECT ${facets[source]} FROM ${source} WHERE ${facets[source]} LIKE ?`)
            .raw()
            .all(`%${pattern}%`)
            .map(r => r[0]);
    },
    
    getImages: async function(treatmentId) {
    
        const _getRecords = async (query) => {
    
            let recordId = '';
            if (query.indexOf('id=') > -1) {
                recordId = query.substr(3)
            }
        
            let Zenodo = 'https://zenodo.org/api/records/';
        
            // ignore all other query params if id is present
            if (recordId) {
                Zenodo = Zenodo + recordId;
        
                try {
                    console.log('querying ' + Zenodo);
                    const {res, payload} =  await Wreck.get(Zenodo);
                    return await JSON.parse(payload);
                }
                catch(err) {
                    console.error(err);
                }
            }
            else {
                Zenodo = Zenodo + '?' + query;
        
                try {
                    console.log('querying ' + Zenodo);
                    const {res, payload} =  await Wreck.get(Zenodo);
                    const result = await JSON.parse(payload);
                    const total = result.hits.total;
        
                    if (total) {
        
                        console.log(`found ${total} open records… now getting their images`);
                        console.log(`number of hits: ${result.hits.hits.length}`);
        
                        let imagesOfRecords = {};
                        await Promise.all(result.hits.hits.map(async (record) => {
                            
                            const bucket = await _getBuckets(record.links.self);
                            if (bucket) {
                                const contents = await _getImageFiles(bucket);
        
                                imagesOfRecords[record.links.self] = {
                                    title: record.metadata.title,
                                    creators: record.metadata.creators,
                                    images: contents.map(function(el) {
                                        return el.links.self;
                                    }),
                                    thumb250: record.links.thumb250 ? record.links.thumb250 : 'na'
                                };
                            }
                            
                        }));
        
                        return {"total": total, "images": imagesOfRecords};
                    }
                    else {
                        console.log('nothing found');
                        return {"total": 0, "images": {}};
                        //return Utils.errorMsg;
                    }
                }
                catch(err) {
                    console.error(err);
                }
            }
            
        };

        const _getImageFiles = async function(uri) {
    
            if (uri) {
                const { res, payload } = await Wreck.get(uri);
                const contents = JSON.parse(payload.toString()).contents;
                return contents;
            }
            
        };
        
        const _getBuckets = async function(uri) {
        
            const { res, payload } = await Wreck.get(uri);
            const bucket = JSON.parse(payload.toString()).links.bucket;
            return bucket;
        };

    
        return await _getRecords(`access_right=open&page=1&q=${treatmentId}&size=30&type=image`);
    },
    
    halify: function({records, uri, resource, id}) {
        records.forEach(row => {
            row._links = this.makeSelfLink({
                uri: uri,
                path: resource.toLowerCase(),
                queryString: `${id}=${row[id]}`
            })
        });

        return records;
    },

    makeCache: function({server, options, query, plugins}) {
        return server.cache({
            cache: options.cacheName,
            expiresIn: options.expiresIn,
            generateTimeout: options.generateTimeout,
            segment: plugins._resources, 
            generateFunc: async (cacheKey) => { 
                return await query(cacheKey) 
            },
            getDecoratedValue: options.getDecoratedValue
        });
    },

    // cacheKey is the URL query without the refreshCache param.
    // The default params, if any, are used in making the cacheKey.
    makeCacheKey: function(request) {

        // remove 'refreshCache' from the query params
        const arr = [];
        for (let k in request.query) {
            if (k !== 'refreshCache') {
                arr.push(k + '=' + request.query[k]);
            }
        }
    
        let s = '';
        if (arr.length) {
            s = arr.sort().join('&');
        }
        // now make the queryString into a standard form (all params 
        // sorted) and prefix it with the pathname
        return request.url.pathname + '?' + s;
    },

    makeQueryObject: function(cacheKey) {

        const queryObject = {};
        if (cacheKey.indexOf('?') > -1) {
            cacheKey.split('?')[1].split('&').forEach(pair => {
                queryObject[pair.split('=')[0]] = pair.split('=')[1]
            })
        }
        
        return queryObject;
    },

    calcStats: function({stats, queryObject}) {
    
        /*
        statistics = [
            {
                'chart-name': 'Chart one',
                'x-axis': {
                    name: 'materials citations',
                    values: []
                },
                'y-axis': {
                    name: 'collecting codes',
                    values: []
                }
            }
        ]
        */
   
        const statistics = [];
        // let chartKey = 'keys';
        // let chartVal = 'vals';
    
        for (let chart in stats) {
            const c = {};
            c['chart-name'] = chart;
            c['chart-id'] = chart.replace(/ /g, '').toLowerCase();
            c['x-axis'] = {};
            c['y-axis'] = {};

            const queries = stats[chart];
            
            //statistics[chart] = {};
    
            queries.forEach((q, i) => {
                //console.log(q)

                if (i === 0) {
                    c.default = true;
                }

                const rows = (queryObject && Object.keys(queryObject).length) ? 
                    dbTreatments.prepare(q).all(queryObject) : 
                    dbTreatments.prepare(q).all();

                if (rows.length > 1) {
                    rows.forEach((row, index) => {
                        if (index === 0) {
                            c['x-axis'].name = Object.keys(row)[0];
                            c['y-axis'].name = Object.keys(row)[1];
                        }
    
                        if (c['x-axis'].values) {
                            c['x-axis'].values.push(Object.values(row)[0]);
                        }
                        else {
                            c['x-axis'].values = [ Object.values(row)[0] ];
                        }
    
                        if (c['y-axis'].values) {
                            c['y-axis'].values.push(Object.values(row)[1]);
                        }
                        else {
                            c['y-axis'].values = [ Object.values(row)[1] ];
                        }
                    })
                }
                else {
                    for (let [key, val] of Object.entries(rows[0])) {
                        if (c['x-axis'].values) {
                            c['x-axis'].values.push(key);
                        }
                        else {
                            c['x-axis'].values = [ key ];
                        }
                        
                        if (c['y-axis'].values) {
                            c['y-axis'].values.push(val);
                        }
                        else {
                            c['y-axis'].values = [ val ];
                        }
                    }
                }
            });

            statistics.push(c)
        }
    
        return statistics;
    
    },

    makeLink: function({uri, params, page}) {
        const qs = Object.entries(params)
            .filter(e => e[0] !== 'path')
            .map(e => page ? `${e[0]}=${(e[0] === 'page' ? page : e[1])}` 
                    : e[0] === 'resourceId' ? `${e[1].key}=${e[1].val}`
                    : `${e[0]}=${e[1]}`)
            .sort()
            .join('&');

        return { href: `${uri}/${params.path}?${qs}` }
    },

    /* The incoming queryObject is changed so queries can be made */
    modifyIncomingQueryObject: function(queryObject, resource) {

        /***************************************************************/
        /* lookups                                                      */
        /***************************************************************/

        // This is the easiest as nothing is added to queryObject, so 
        // we avoid this completely
        if (resource.group !== 'lookups') {

            // The following are added to queryObject whether the 
            // resource is being fetched from Zenodo or from Zenodeo
            queryObject.resource = resource.name;
            queryObject.resourceId = resource.resourceId;
            queryObject.path = resource.name.toLowerCase();
            
            if (! queryObject.page) queryObject.page = 1;
            if (! queryObject.size) queryObject.size = 30;

            // The following are added *only* for resources being
            // fetched from zenodeo
            if (resource.group === 'zenodeoCore' || resource.group === 'zenodeoRelated') {

                // 'page' and 'size' are not really needed for Zenodeo 
                // resources. Instead, 'limit' and 'offset' are needed 
                // for the SQL queries. But we add 'page' and 'size' 
                // to the queryObject to have a consistent query syntax
                //  vis a vis Zenodo queries, and then calculate the 
                // 'limit' and 'offset' from these values.
                queryObject.limit = parseInt(queryObject.size);
                queryObject.offset = (queryObject.page - 1) * queryObject.limit;
            }

        }

        return queryObject;
    },

    /* Some keys are removed from the queryObject so it can be converted to a 
    human-readable search string */
    makeSearchCriteria: function(queryObject) {

        const sc = {};

        // The following params may already be present or may get added 
        // to the queryObject but they are not used when making the 
        //_self, _prev, _next links, or the search-criteria 
        const exclude = [
            'facets',
            'limit', 
            'offset', 
            //'page',
            //'path', 
            'refreshCache', 
            'resource', 
            'resourceId', 
            //'size',
            'stats'
        ];

        if (queryObject[queryObject.resourceId]) {
            exclude.push(...['page', 'size']);
        }

        for (let key in queryObject) {
            if (! exclude.includes(key)) {
                sc[key] = queryObject[key];
            }
        }

        return sc;
    },

    makeRemoteQueryString: function(queryObject) {
        const qArr = [];

        const seen = {
            creator: false,
            title: false
        };

        // this is where we store all the query params so we can 
        // create a query from them
        const params = [];

        for (let k in queryObject) {

            // 'resources' and 'refreshCache' are not sent to Zenodo
            if (k !== 'refreshCache' && k !== 'resources') {

                const param = queryObject[k];

                if (Array.isArray(param)) {

                    // convert 'type' into 'subtype' and join all of them into the query like so
                    // subtype=value1&subtype=value2&subtype=value3
                    if (k === 'type') k = 'subtype';
                    param.forEach(p => params.push(`${k}=${p}`));

                }
                else {
                    if (k === 'type') {
                        if (param.toLowerCase() === 'all') {

                            const resources = ['publications', 'images'];
                            if (resources.includes(queryObject.resources)) {
                                let v = Schema.defaults[queryObject.resources];
                                v = v.filter(i => i !== 'all');
                                v.forEach(t => params.push(`subtype=${t}`));
                            }
                        }
                        else {
                            params.push(`subtype=${param}`);
                        }
                    }
                    else if (k === 'communities') {
                        if (param.toLowerCase() === 'all') {
                            let v = Schema.defaults.communities;
                            v = v.filter(i => i !== 'all');
                            v.forEach(t => params.push(`communities=${t}`));
                        }
                        else {
                            params.push(`communities=${param}`);
                        }
                    }

                    else if (k === 'creator') {

                        if (! seen.creator) {
                            let c = queryObject.creator;

                            if (c.indexOf(' AND ') > -1) {
                                c = `(${c})`;
                            }
                            else if (/".+"/.test(c)) {
                                c = c;
                            }
                            else {
                                c = `/${c}.*/`;
                            }
        
                            qArr.push('+creators.name:' + c);
        
                            // remove 'creator' from queryObject as its job is done
                            delete(queryObject.creator);
                            seen.creator = true;
                        }
                        
                    }

                    else if (k === 'title') {

                        if (! seen.title) {
                            let c = queryObject.title;

                            if (c.indexOf(' AND ') > -1) {
                                c = `(${c})`;
                            }
                            else if (/".+"/.test(c)) {
                                c = c;
                            }
                            else {
                                c = `/${c}.*/`;
                            }
        
                            qArr.push('+title:' + c);
        
                            // remove 'title' from queryObject as its job is done
                            delete(queryObject.title);
                            seen.title = true;
                        }
                        
                    }

                    else if (k === 'q') {

                        qArr.push(queryObject.q);

                        if (queryObject.creator) {
                            if (! seen.creator) {
                                let c = queryObject.creator;

                                if (c.indexOf(' AND ') > -1) {
                                    c = `(${c})`;
                                }
                                else if (/".+"/.test(c)) {
                                    c = c;
                                }
                                else {
                                    c = `/${c}.*/`;
                                }
            
                                qArr.push('+creators.name:' + c);
            
                                // remove 'creator' from queryObject as its job is done
                                delete(queryObject.creator);
                                seen.creator = true;
                            }
                        }
                        else if (queryObject.title) {
                            if (! seen.title) {
                                let c = queryObject.title;

                                if (c.indexOf(' AND ') > -1) {
                                    c = `(${c})`;
                                }
                                else if (/".+"/.test(c)) {
                                    c = c;
                                }
                                else {
                                    c = `/${c}.*/`;
                                }
            
                                qArr.push('+title:' + c);
            
                                // remove 'title' from queryObject as its job is done
                                delete(queryObject.title);
                                seen.title = true;
                            }
                        }
                        else {
                            params.push(`${k}=${param}`);
                        }
                    }

                    else {
                        params.push(`${k}=${param}`);
                    }
                }
            }
        }

        const q = encodeURIComponent(qArr.join(' '));
        const p = params.join('&');

        const uri = `q=${q}&${p}&type=${queryObject.resource.slice(0, -1)}&access_right=open`;

        return uri;
    }
}

