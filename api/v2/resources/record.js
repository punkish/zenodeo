const Wreck = require('wreck');
const Schema = require('../schema.js');
const Config = require('../../../config.js');
const ResponseMessages = require('../../response-messages');
const Utils = require('../utils.js');
const Debug = require('debug')('v2: record');
const Cache = Utils.cache('record');

const getRemoteData = async function(uri) {

    const { res, payload } = await Wreck.get(uri);
    return JSON.parse(payload);
};

const newQuery = async function(ZenodoUri, zenodeoUri, getImages) {

    let result = await getRemoteData(ZenodoUri);

    if (getImages) {
        const imagesResult = await getRemoteData(result.links.bucket);

        let images = [];
        imagesResult.contents.forEach(function(element) {
            images.push(element.links.self);
        });

        result = images;
    }
    
    return Utils.packageResult(zenodeoUri, result);
}

const record = {
    method: 'GET',
    path: 'record/{id}',
    handler: async function(request, h) {

        const [ZenodoUri, zenodeoUri, cacheKey] = Utils.makeIncomingUri(request, 'record');

        const getImages = request.query.images || false;
        let result;

        // perform a new query only if refreshCache is true
        if (request.query.refreshCache) {
            result = newQuery(ZenodoUri, zenodeoUri, getImages);
            Utils.updateCache(Cache, cacheKey, result);
            return result;
        }

        // serve result from cache if it exists in cache
        else {
            if (result = Cache.getSync(cacheKey)) {
                return result;
            }
            else {
                result = newQuery(ZenodoUri, zenodeoUri, getImages);
                Utils.updateCache(Cache, cacheKey, result);
                return result;
            }
        }
    },

    config: {
        description: "fetch a single record from Zenodo",
        tags: ['record', 'api'],
        plugins: {
            'hapi-swagger': {
                order: 3,
                responseMessages: ResponseMessages
            }
        },
        validate: Schema.record,
        notes: [
            'This is the main route for fetching a record matching an id or a set of records matching the provided query parameters.'
        ]
    }
};

module.exports = record;