const Wreck = require('wreck');
const Schema = require('../schema.js');
const Config = require('../../../config.js');
const ResponseMessages = require('../../response-messages');
const Utils = require('../utils.js');
const Cache = Utils.cache('records');

let imagesOfRecords = {};

const getImageFiles = async function(bucket_uri, record) {

    const { res, payload } = await Wreck.get(bucket_uri);
    const contents = JSON.parse(payload.toString()).contents;
    imagesOfRecords[record.links.self] = {
        title: record.metadata.title,
        creators: record.metadata.creators,
        images: contents.map(function(el) {
            return el.links.self;
        }),
        thumb250: record.links.thumb250
    };
};

const getBuckets = async function(record) {

    if (record.metadata.access_right === 'open') {
        const { res, payload } = await Wreck.get(record.links.self);
        const bucket = JSON.parse(payload.toString()).links.bucket;
        await getImageFiles(bucket, record);
    }
};

const getImages = async function (uri, cacheKey, reply) {
    
    // make sure imagesOfRecords is empty
    for (let i in imagesOfRecords) {
        delete imagesOfRecords[i];
    }

    console.log(`searching for ${uri}`);
    console.log(`cacheKey ${cacheKey}`);
    const {res, payload} =  await Wreck.get(uri);

    /*
     The payload looks like so
     
        {
            "aggregations": {
                "access_right": {…
                },
                "file_type": {…
                },
                "keywords": {…
                },
                "type": {…
                }
            },
            "hits": {
                "hits": [
                    {
                        "conceptdoi": "10.5281/zenodo.1168647", 
                        "conceptrecid": "1168647", 
                        "created": "2018-02-07T18:50:09.513011+00:00", 
                        "doi": "10.5281/zenodo.1168648", 
                        "id": 1168648, 
                        "links": {
                            "badge": "https://zenodo.org/badge/doi/10.5281/zenodo.1168648.svg", 
                            "bucket": "https://zenodo.org/api/files/b41da27b-ee34-4259-90b4-ab08c25b533c", 
                            "conceptbadge": "https://zenodo.org/badge/doi/10.5281/zenodo.1168647.svg", 
                            "conceptdoi": "https://doi.org/10.5281/zenodo.1168647", 
                            "doi": "https://doi.org/10.5281/zenodo.1168648", 
                            "html": "https://zenodo.org/record/1168648", 
                            "latest": "https://zenodo.org/api/records/1168648", 
                            "latest_html": "https://zenodo.org/record/1168648", 
                            "self": "https://zenodo.org/api/records/1168648", 
                            "thumb250": "https://zenodo.org/api/iiif/v2/b41da27b-ee34-4259-90b4-ab08c25b533c:8dbadf2e-cc29-4dfc-9473-f26fa775e720:figure.png/full/250,/0/default.png"
                        }, 
                        "metadata": {
                            "access_right": "open", 
                            "access_right_category": "success", 
                            "communities": [
                                { "id": "biosyslit" },
                                {}
                            ], 
                            "creators": [
                                { "name": "Cedric A. Collingwood" }, 
                                { "name": "Donat Agosti" }, 
                                {}
                            ], 
                            "description": "Plates 73\u201376. Tetramorium latinode Collingwood &amp; Agosti. 73: Full face view of head; 74: Head profile.75: Fullface view of head; 76: Headprofile.(Photographsfrom Sharaf&amp; Aldawood, in press).", 
                            "doi": "10.5281/zenodo.1168648", 
                            "journal": {
                                "pages": "1-70", 
                                "title": "Arthropod fauna of the UAE", 
                                "volume": "4"
                            }, 
                            "keywords": [
                                "Biodiversity", 
                                "Taxonomy", 
                                "Animalia", 
                                "Arthropoda", 
                                "Insecta", 
                                "Hymenoptera", 
                                "Formicidae", 
                                "Tetramorium"
                            ], 
                            "license": {
                                "id": "notspecified"
                            }, 
                            "publication_date": "2011-05-31", 
                            "related_identifiers": [
                                {
                                    "identifier": "http://treatment.plazi.org/id/1A4C094D372BFFF0ED69A7641865EBD5", 
                                    "relation": "isCitedBy", 
                                    "scheme": "url"
                                }, 
                                {
                                    "identifier": "10.5281/zenodo.1168586", 
                                    "relation": "isPartOf", 
                                    "scheme": "doi"
                                }, 
                                {}
                            ], 
                            "relations": {
                                "version": [
                                    {
                                        "count": 1, 
                                        "index": 0, 
                                        "is_last": true, 
                                        "last_child": {
                                            "pid_type": "recid", 
                                            "pid_value": "1168648"
                                        }, 
                                        "parent": {
                                            "pid_type": "recid", 
                                            "pid_value": "1168647"
                                        }
                                    }
                                ]
                            }, 
                            "resource_type": {
                                "subtype": "figure", 
                                "title": "Figure", 
                                "type": "image"
                            }, 
                            "title": "Plates 73\u201376. Tetramorium latinode Collingwood & Agosti. 73 in Order Hymenoptera, family Formicidae"
                        }, 
                        "owners": [ 1161 ], 
                        "revision": 1, 
                        "updated": "2018-02-07T18:50:09.877875+00:00"
                    },
                    {},
                ],
                total: 102
            },
            "links": {
                "next": "https://zenodo.org/api/records/?sort=bestmatch&q=agosti&communities=biosyslit&type=image&page=2&size=30", 
                "self": "https://zenodo.org/api/records/?sort=bestmatch&q=agosti&communities=biosyslit&type=image&page=1&size=30"
            }
        }
    */

    //const result = JSON.parse(payload.toString()).hits;
    //const total = result.total;
    const result = JSON.parse(payload.toString());
    let total = 0;
    for (let i in result.aggregations.access_right.buckets) {
        if (result.aggregations.access_right.buckets[i].key === 'open') {
            total = result.aggregations.access_right.buckets[i].doc_count;
        }
    }

    if (total) {

        console.log(`found ${total} open records… now getting their images`);
        const foundRecords = result.hits.hits.map(getBuckets);

        const done = Promise.all(foundRecords);
        done.then(function() {
            
            console.log(`found ${Object.keys(imagesOfRecords).length} images… done`);
            const data = {
                uri: uri,
                total: total,
                result: imagesOfRecords
            };

            Cache.put(cacheKey, data, function(err) {
                if (err) {
                    console.log(err);
                }

                console.log('caching the result');
                reply(data).headers = res.headers;
            });
        }).catch(error => { 
            console.log(error)
        });
    }
    else {
        console.log('nothing found');
        reply(0).headers = res.headers;
    }
};

const getRecords = async function (uri, cacheKey, reply) {
    
    const { res, payload } = await Wreck.get(uri);
    const result = JSON.parse(payload.toString());
    const data = {
        uri: uri,
        result: result
    };

    Cache.put(cacheKey, data, function(err) {
        if (err) {
            console.log(err);
        }

        reply(data).headers = res.headers;
    });
};

const getSummaryOfRecords = async function (uri, cacheKey, reply) {
    
    const { res, payload } = await Wreck.get(uri);
    const summary = JSON.parse(payload.toString())
        .hits
        .hits
        .map(function(element) {
            return element.links.self;
        });

    const data = {
        uri: uri,
        result: summary
    };

    Cache.put(cacheKey, data, function(err) {
        if (err) {
            console.log(err);
        }

        reply(data).headers = res.headers;
    });
};

const records = {
    method: 'GET',

    path: "/records",

    config: {
        description: "records",
        tags: ['record', 'api'],
        plugins: {
            'hapi-swagger': {
                order: 3,
                responseMessages: ResponseMessages
            }
        },
        validate: {
            query: Schema.record
        },
        notes: [
            'This is the main route for fetching records matching the provided query parameters.'
        ]
    },

    handler: function(request, reply) {
        let uri = Config.uri + 'records/?communities=biosyslit';
        
        // construct the 'uri' based on the query params that will 
        // be sent to Zenodo. Note that the following query params 
        // are NOT sent to Zenodo. They are only for local logic
        //    request.query.summary
        //    request.query.refreshCache
        //    request.query.images
        [
            'q', 
            'file_type', 
            'type', 
            'image_subtype', 
            'publication_subtype', 
            'access_right', 
            'keywords',
            'size',
            'page'
        ].forEach(function(param) {
            if (request.query[param]) {
                uri += `&${param}=${encodeURIComponent(request.query[param])}`;
            }
        });

        // now that the 'uri' has been constructed, let's get either 
        // a summary or images or complete details
        let cacheKey = '';
        if (request.query.summary) {

            cacheKey = Utils.createCacheKey(uri + '&summary=' + request.query.summary);

            if (request.query.refreshCache) {
                try {
                    getSummaryOfRecords(uri, cacheKey, reply);
                }
                catch (error) {
                    console.error(error);
                }
            }
            else {
                Cache.get(cacheKey, function(err, result) {
                    if (err) {
                        console.log(err);
                    }
                    
                    if (result) {
                        reply(result);
                    }
                    else {
                        try {
                            getSummaryOfRecords(uri, cacheKey, reply);
                        }
                        catch (error) {
                            console.error(error);
                        }
                    }
                });
            }
        }
        else if (request.query.images) {
            
            cacheKey = Utils.createCacheKey(uri + '&image=' + request.query.images);

            if (request.query.refreshCache) {

                console.log('refreshing cache');
                try {
                    getImages(uri, cacheKey, reply);
                }
                catch (error) {
                    console.error(error);
                }
            }
            else {
                Cache.get(cacheKey, function(err, result) {
                    console.log('checking cache');

                    if (err) {
                        console.log(err);
                    }

                    if (result) {
                        console.log('found result in cache');
                        reply(result);
                    }
                    else {
                        console.log('doing a fresh query');
                        try {
                            getImages(uri, cacheKey, reply);
                        }
                        catch (error) {
                            console.error(error);
                        }
                    }
                });
            }
        }
    
        // return the all the details of all the records
        else {
            cacheKey = Utils.createCacheKey(uri);

            if (request.query.refreshCache) {
                try {
                    getRecords(uri, cacheKey, reply);
                }
                catch (error) {
                    console.error(error);
                }
            }
            else {
                Cache.get(cacheKey, function(err, result) {
                    if (err) {
                        console.log(err);
                    }

                    if (result) {
                        reply(result);
                    }
                    else {
                        try {
                            getRecords(uri, cacheKey, reply);
                        }
                        catch (error) {
                            console.error(error);
                        }
                    }
                });
            }
        }
    }
};

module.exports = records;