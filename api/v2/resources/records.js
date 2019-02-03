const Wreck = require('wreck');
const Schema = require('../schema.js');
const Config = require('../../../config.js');
const ResponseMessages = require('../../response-messages');
const Utils = require('../utils.js');
const Debug = require('debug')('v2: records');
const Cache = Utils.cache('records');

const newQuery = async function(ZenodoUri, zenodeoUri, images, summary) {

    let result;
    if (images) {
        result = await getImages(ZenodoUri);
    } else if (summary) {
        result = await getSummaryOfRecords(ZenodoUri);
    }

    return Utils.packageResult(zenodeoUri, result);
};

const getImageFiles = async function(uri) {

    if (uri) {
        const { res, payload } = await Wreck.get(uri);
        const contents = JSON.parse(payload.toString()).contents;
        return contents;
    }
    
};

const getBuckets = async function(uri) {

    const { res, payload } = await Wreck.get(uri);
    const bucket = JSON.parse(payload.toString()).links.bucket;
    return bucket;
};

const getImages = async function(uri) {

    Debug(`searching for ${uri}`);

    try {
        const {res, payload} =  await Wreck.get(uri);
        const result = await JSON.parse(payload);
        const total = result.hits.total;

        if (total) {

            Debug(`found ${total} open records… now getting their images`);
            Debug(`number of hits: ${result.hits.hits.length}`);

            let imagesOfRecords = {};
            await Promise.all(result.hits.hits.map(async (record) => {
                
                const bucket = await getBuckets(record.links.self);
                if (bucket) {
                    const contents = await getImageFiles(bucket);

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
            Debug('nothing found');
            return Utils.errorMsg;
        }
        
    }
    catch(err) {
        console.error(err);
    }
};

const getSummaryOfRecords = async function (uri) {
    
    const { res, payload } = await Wreck.get(uri);
    const summary = JSON.parse(payload)
        .hits
        .hits
        .map(function(element) {
            return element.links.self;
        });

    return summary;
};

const records = {

    method: 'GET',
    path: "records/",
    handler: async function(request, h) {

        const [ZenodoUri, zenodeoUri, cacheKey] = Utils.makeIncomingUri(request, 'records');

        const getSummary = request.query.summary || false;
        const getImages = request.query.images || false;
        let result;

        // perform a new query only if refreshCache is true
        if (request.query.refreshCache) {
            result = newQuery(ZenodoUri, zenodeoUri, getImages, getSummary);
            Utils.updateCache(Cache, cacheKey, result);
            return result;
        }

        // serve result from cache if it exists in cache
        else {
            if (result = Cache.getSync(cacheKey)) {
                return result;
            }
            else {
                result = newQuery(ZenodoUri, zenodeoUri, getImages, getSummary);
                Utils.updateCache(Cache, cacheKey, result);
                return result;
            }
        }
    },

    config: {
        description: "fetch records from Zenodo",
        tags: ['records', 'api'],
        plugins: {
            'hapi-swagger': {
                order: 4,
                responseMessages: ResponseMessages
            }
        },
        validate: Schema.records,
        notes: [
            'This is the main route for fetching records matching the provided query parameters.'
        ]
    }
};

module.exports = records;