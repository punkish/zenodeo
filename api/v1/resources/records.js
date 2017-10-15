const Wreck = require('wreck');
const Schema = require('../schema.js');
const Config = require('../../../config.js');
const ResponseMessages = require('../../response-messages');

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
            'This is the main route for fetching records matching the provided query parameters.',
        ]
    },

    handler: function(request, reply) {
        let uri = Config.uri + 'records/?communities=biosyslit';
        
        // construct the 'uri' based on the query params
        if (request.query.q) {
            uri += '&q=' + encodeURIComponent(request.query.q);
        }

        if (request.query.file_type) {
            uri += '&file_type=' + encodeURIComponent(request.query.file_type);
        }
    
        if (request.query.type) {
            uri += '&type=' + encodeURIComponent(request.query.type);
        }
        
        if (request.query.image_subtype) {
            uri += '&subtype=' + encodeURIComponent(request.query.image_subtype);
        }
        else if (request.query.publication_subtype) {
            uri += '&subtype=' + encodeURIComponent(request.query.publication_subtype);
        }
        
        if (request.query.access_right) {
            uri += '&access_right=' + encodeURIComponent(request.query.access_right);
        }
    
        if (request.query.keywords) {
            uri += '&keywords=' + encodeURIComponent(request.query.keywords);
        }
    
        // now that the 'uri' has been constructed, let's get either 
        // a summary or images or complete details
        if (request.query.summary) {
            const getSummaryOfRecords = async function () {
                
                const { res, payload } = await Wreck.get(uri);
                const summary = JSON.parse(payload.toString())
                    .hits
                    .hits
                    .map(function(element) {
                        return element.links.self;
                    });

                reply(summary).headers = res.headers;
            };
            
            try {
                getSummaryOfRecords();
            }
            catch (error) {
                console.error(error);
            }
        }
        else if (request.query.images) {

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

                    reply(imagesOfRecords).headers = res.headers;
                }
                catch (error) {
                    console.log(error);
                } 
            };

            getImages(uri);
        }
    
        // return the all the details of all the records
        else {
            const getRecords = async function (uri) {
                
                const { res, payload } = await Wreck.get(uri);
                reply(JSON.parse(payload.toString())).headers = res.headers;
            };
            
            try {
                getRecords(uri);
            }
            catch (error) {
                console.error(error);
            }
        }
    }
};

module.exports = records;