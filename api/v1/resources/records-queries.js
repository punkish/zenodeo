const Wreck = require('wreck');
const Cache = require('persistent-cache')({
    name: 'records'
});

let imagesOfRecords = {};

const getImageFiles = async function(uri, record) {

    const { res, payload } = await Wreck.get(uri);
    const contents = JSON.parse(payload.toString()).contents;
    imagesOfRecords[record] = contents.map(function(el) {
        return el.links.self; 
    });
};

const getBuckets = async function(record) {

    const { res, payload } = await Wreck.get(record.links.self);
    const bucket = JSON.parse(payload.toString()).links.bucket;
    await getImageFiles(bucket, record.links.self);
};

const recordsQueries = {

    getImages: async function (uri, cacheKey, reply) {
    
        console.log(`searching for ${uri}`);
        //reply(`searching for ${uri}`);
        const {res, payload} =  await Wreck.get(uri);
        const result = JSON.parse(payload.toString()).hits;
        const numOfFoundRecords = result.total;

        if (numOfFoundRecords) {

            console.log(`found ${numOfFoundRecords}… now getting images`);
            //reply(`found ${numOfFoundRecords}… now getting images`);
            const foundRecords = result.hits.map(getBuckets);

            const done = Promise.all(foundRecords);
            done.then(function() {
                
                console.log(`found ${Object.keys(imagesOfRecords).length} images… done`);
                //reply(`found ${Object.keys(imagesOfRecords)} images… done`);
                Cache.put(cacheKey, imagesOfRecords, function(err) {
                    if (err) {
                        console.log(err);
                    }

                    console.log("caching the result");
                    //reply('caching the result');
                    reply(imagesOfRecords).headers = res.headers;
                });
            });
        }
        else {
            console.log('nothing found');
            reply(0).headers = res.headers;
        }
    },

    getRecords: async function (uri, cacheKey, reply) {
    
        const { res, payload } = await Wreck.get(uri);
        const result = JSON.parse(payload.toString());
        Cache.put(cacheKey, result, function(err) {
            if (err) {
                console.log(err);
            }

            reply(result).headers = res.headers;
        });
    },

    getSummaryOfRecords: async function (uri, cacheKey, reply) {
    
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
    }
};

module.exports = recordsQueries;