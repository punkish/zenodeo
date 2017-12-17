const Wreck = require('wreck');
const Schema = require('../schema.js');
const Config = require('../../../config.js');
const ResponseMessages = require('../../response-messages');
const Utils = require('../utils.js');
const Cache = require('persistent-cache')({
    name: 'records'
});
const recordsQueries = require('./records-queries.js');

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
                    recordsQueries.getSummaryOfRecords(uri, cacheKey);
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
                                recordsQueries.getSummaryOfRecords(uri, cacheKey);
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
                    recordsQueries.getImages(uri, cacheKey, reply);
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
                            recordsQueries.getImages(uri, cacheKey, reply);
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
                    recordsQueries.getRecords(uri, cacheKey);
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
                            recordsQueries.getRecords(uri, cacheKey);
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