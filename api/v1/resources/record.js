const Wreck = require('wreck');
const Schema = require('../schema.js');
const Config = require('../../../config.js');
const ResponseMessages = require('../../response-messages');
const Utils = require('../utils.js');
const Cache = Utils.cache('record');

const getResult = function(uri, getImages) {

    let result;

    try {
        result = getRemoteData(uri);
        
        if (getImages) {
            
            try {
                const imagesPayload = getRemoteData(result.links.bucket);

                let images = [];
                imagesPayload.contents.forEach(function(element) {
                    images.push(element.links.self);
                });

                result = images;
            }
            catch(err) {
                console.error(err);
            }
        }

        return result;
    }
    catch(err) {
        console.error(err);
    }
};

const getRemoteData = async function(uri) {

    const { res, payload } = await Wreck.get(uri);
    return JSON.parse(payload);
};

const record = {
    method: 'GET',
    path: '/record/{id}',

    handler: function(request, h) {

        // construct the URI
        const uri = Config.uri + 'records/' + encodeURIComponent(request.params.id);
        
        // construct the cacheKey
        let cacheUri = uri;
        let getImages = false;
        if (request.query.images) {
            cacheUri += `?images=${request.query.images}`;
            getImages = request.query.images;
        }
        const cacheKey = Utils.createCacheKey(cacheUri);

        let result;
        if (request.query.refreshCache) {

            if (result = getResult(uri, getImages)) {
        
                Utils.updateCache(Cache, cacheKey, result);
                return result;
            }
            else {
                
                // getResult failed
                if (result = Cache.getSync(cacheKey)) {
        
                    // return result from cache
                    return result;
                }
                else {
        
                    // no result in cache
                    return Utils.errorMsg;
                }
            }
        }
        else {
            if (result = Cache.getSync(cacheKey)) {
        
                // return result from cache
                return result;
            }
            else {
                if (result = getResult(uri, getImages)) {

                    Utils.updateCache(Cache, cacheKey, result);
                    return result;
                }
                else {

                    return Utils.errorMsg;
                }
            }
        }
    },

    config: {
        description: "fetch a single record from Zenodo",
        tags: ['record', 'api'],
        plugins: {
            'hapi-swagger': {
                order: 2,
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