const Wreck = require('@hapi/wreck');
// const Schema = require('./schema.js');
// const ResponseMessages = require('../responseMessages');
// const debug = require('debug')('v2:utils');

const config = require('config');
const plog = require(config.get('plog'));

const Database = require('better-sqlite3');
const dbFacets = new Database(config.get('data.facets'));
const dbTreatments = new Database(config.get('data.treatments'));

// const data = {
//     authors: require(authors),
//     keywords: require(keywords),
//     taxa: require(taxa),
//     families: require(families)
// };

const facets = {
    authors: 'author',
    families: 'family',
    keywords: 'keyword',
    taxa: 'taxon'
};

module.exports = {
    // findjs: function(pattern, source) {
    //     const re = new RegExp(`^${pattern}`, 'i');
    //     const res = data[source].filter(function(element) {
    //         return (element.search(re) > -1)
    //     });
    
    //     return(res);
    // },

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
                resource: resource.toLowerCase(),
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
            segment: plugins._segment, 
            generateFunc: async (cacheKey) => { 
                return await query({cacheKey, plugins}) 
            },
            getDecoratedValue: options.getDecoratedValue
        });
    },

    // cacheKey is the URL query without the refreshCache param.
    // The default params, if any, are used in making the cacheKey.
    makeCacheKey: function(request) {

        // debug(`url.href: ${request.url.href}`);
        // debug(`url.pathname: ${request.url.pathname}`);
        // debug(`url.search: ${request.url.search}`);
        // debug(`url.searchParams: ${request.url.searchParams}`);

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

    makeSelfLink: function({uri, resource, queryString}) {
        return { self: { href: `${uri}/${resource}?${queryString}` } }
    },

    makeLink: function({uri, resource, queryString}) {
        return { href: `${uri}/${resource}?${queryString}` };
    }
}

