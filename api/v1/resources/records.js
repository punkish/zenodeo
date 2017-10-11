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
            
        if (request.query.file_type) {
            uri += '&file_type=' + encodeURIComponent(request.query.file_type);
        }
    
        if (request.query.type) {
            uri += '&subtype=' + encodeURIComponent(request.query.type);
        }
        
        if (request.query.subtype) {
            uri += '&subtype=' + encodeURIComponent(request.query.subtype);
        }
        
        if (request.query.access_right) {
            uri += '&access_right=' + encodeURIComponent(request.query.access_right);
        }
    
        if (request.query.keywords) {
            uri += '&keywords=' + encodeURIComponent(request.query.keywords);
        }
    
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
            let imagesOfRecords = {};

            const getImagesOfRecords = async function(uri) {
                
                const { res, payload } = await Wreck.get(uri);
                const records = JSON.parse(payload.toString())
                    .hits
                    .hits
                    .map(function(element) {
                        return element.links.self;
                    });

                // async/await don't work with [].forEach()so using
                // `for (let element of array) {}` form
                // see https://stackoverflow.com/a/37576787 for details
                for (let record of records) {
                    const imagesOfOneRecord = await getImagesOfOneRecord(record);
                    imagesOfRecords[record] = imagesOfOneRecord;
                };

                reply(imagesOfRecords);
            };

            const getBucketForOneRecord = async function(record) {
                
                const { res, payload } = await Wreck.get(record);
                
                try {
                    return JSON.parse(payload.toString()).links.bucket;
                }
                catch (error) {
                    console.error(error);
                }
            };
            
            const getImagesOfOneRecord = async function(record) {
                
                const bucket = await getBucketForOneRecord(record);
                const { res, payload } = await Wreck.get(bucket);

                try {

                    const contents = JSON.parse(payload.toString()).contents;
                    const imagesOfOneRecord = contents.map(function(el) { return el.links.self; });
                    return imagesOfOneRecord;
                }
                catch (error) {
                    console.error(error);
                }
            };

            try {
                getImagesOfRecords(uri);
                
            }
            catch (error) {
                console.error(error);
            }
        }
    
        // return the all the details of all the records
        else {
            const recordDetails = getRecords(uri);
            reply(recordDetails).headers = res.headers;
        }
    }
};

module.exports = records;