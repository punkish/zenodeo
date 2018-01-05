const Wreck = require('wreck');
const Schema = require('../schema.js');
const Config = require('../../../config.js');
const ResponseMessages = require('../../response-messages');
const Utils = require('../utils.js');
const Cache = require('persistent-cache')({
    name: 'records'
});

let imagesOfRecords = {};

const getImageFiles = async function(bucket_uri, record) {

    const { res, payload } = await Wreck.get(bucket_uri);
    const contents = JSON.parse(payload.toString()).contents;
    imagesOfRecords[record.links.self] = {
        title: record.metadata.title,
        creators: record.metadata.creators,
        images: contents.map(function(el) {
            return el.links.self; 
        })
    };
};

const getBuckets = async function(record) {

    const { res, payload } = await Wreck.get(record.links.self);
    const bucket = JSON.parse(payload.toString()).links.bucket;
    await getImageFiles(bucket, record);
};

const getImages = async function (uri, cacheKey, reply) {
    
    // make sure imagesOfRecords is empty
    for (let i in imagesOfRecords) {
        delete imagesOfRecords[i];
    }

    console.log(`searching for ${uri}`);
    console.log(`cacheKey ${cacheKey}`);
    const {res, payload} =  await Wreck.get(uri);
    const result = JSON.parse(payload.toString()).hits;
    const numOfFoundRecords = result.total;

    if (numOfFoundRecords) {

        console.log(`found ${numOfFoundRecords}… now getting images`);
        const foundRecords = result.hits.map(getBuckets);

        const done = Promise.all(foundRecords);
        done.then(function() {
            
            console.log(`found ${Object.keys(imagesOfRecords).length} images… done`);
            Cache.put(cacheKey, imagesOfRecords, function(err) {
                if (err) {
                    console.log(err);
                }

                console.log("caching the result");
                reply(imagesOfRecords).headers = res.headers;
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
    Cache.put(cacheKey, result, function(err) {
        if (err) {
            console.log(err);
        }

        reply(result).headers = res.headers;
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

    Cache.put(cacheKey, summary, function(err) {
        if (err) {
            console.log(err);
        }

        reply(summary).headers = res.headers;
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
                    getSummaryOfRecords(uri, cacheKey);
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
                    else {
                        if (result) {
                            reply(result);
                        }
                        else {
                            try {
                                getSummaryOfRecords(uri, cacheKey);
                            }
                            catch (error) {
                                console.error(error);
                            }
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
                    getRecords(uri, cacheKey);
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
                            getRecords(uri, cacheKey);
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