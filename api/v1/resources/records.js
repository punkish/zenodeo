const Wreck = require('wreck');
const Schema = require('../schema.js');
const Config = require('../../../config.js');
const ResponseMessages = require('../../response-messages');
const Utils = require('../utils.js');

//const cache = require('persistent-cache');
const Cache = require('persistent-cache')({
    name: 'records'
});

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
        
        // construct the 'uri' based on the query params
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

            cacheKey = Utils.createCacheKey(uri + request.query.summary);
            Cache.get(cacheKey, function(err, result) {
                if (err) {
                    console.log(err);
                }

                if (result) {
                    reply(result);
                }
                else {
                    const getSummaryOfRecords = async function (uri) {
                        
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
    
                    try {
                        getSummaryOfRecords(uri);
                    }
                    catch (error) {
                        console.error(error);
                    }
                }
            });
        }
        else if (request.query.images) {
            
            cacheKey = Utils.createCacheKey(uri + request.query.images);
            Cache.get(cacheKey, function(err, result) {
                if (err) {
                    console.log(err);
                }

                if (result) {
                    reply(result);
                }
                else {
                    try {
                        const getImages = async function(uri) {
                            
                            // get all the records for the query
                            try {
                                const { res, payload } = await Wreck.get(uri);
                                
                                // extract all the links for the records
                                const records = JSON.parse(payload.toString())
                                    .hits
                                    .hits
                                    .map(function(element) {
                                        return element.links.self;
                                    });
            
                                //reply(records).headers = res.headers;
                                // get images for each record
                                let imagesOfRecords = {};
                                for (let record of records) {
                        
                                    // get images of one record
                                    
                                    // first get the bucket for one record
                                    try {
                                        const { res, payload } = await Wreck.get(record);
                                        const bucket = JSON.parse(payload.toString()).links.bucket;
            
                                        try {
                                            // now get the images for the bucket
                                            const { res, payload } = await Wreck.get(bucket);
                                            const contents = JSON.parse(payload.toString()).contents;
                                            const images = contents.map(function(el) { return el.links.self; });
                                            imagesOfRecords[record] = images;
                                        }
                                        catch (error) {
                                            console.log(error);
                                        }
                                    }
                                    catch (error) {
                                        console.log(error);
                                    }
                                };
            
                                Cache.put(cacheKey, imagesOfRecords, function(err) {
                                    if (err) {
                                        console.log(err);
                                    }

                                    reply(imagesOfRecords).headers = res.headers;
                                });
                            }
                            catch (error) {
                                console.log(error);
                            } 
                        };
            
                        getImages(uri);
                    }
                    catch (error) {
                        console.error(error);
                    }
                }
            });
        }
    
        // return the all the details of all the records
        else {
            cacheKey = Utils.createCacheKey(uri);
            Cache.get(cacheKey, function(err, result) {
                if (err) {
                    console.log(err);
                }

                if (result) {
                    reply(result);
                }
                else {
                    try {
                        const getRecords = async function (uri) {
                            
                            const { res, payload } = await Wreck.get(uri);
                            const result = JSON.parse(payload.toString());
                            Cache.put(cacheKey, result, function(err) {
                                if (err) {
                                    console.log(err);
                                }

                                reply(result).headers = res.headers;
                            });
                        };
                        
                        try {
                            getRecords(uri);
                        }
                        catch (error) {
                            console.error(error);
                        }
                    }
                    catch (error) {
                        console.error(error);
                    }
                }
            });
        }
    }
};

module.exports = records;