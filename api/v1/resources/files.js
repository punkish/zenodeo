const Wreck = require('wreck');
const Schema = require('../schema.js');
const Config = require('../../../config.js');
const ResponseMessages = require('../../response-messages');
const Utils = require('../utils.js');
const Cache = Utils.cache('files');

const getResult = async function(uri) {

    const { res, payload } = await Wreck.get(uri);
    const result = JSON.parse(payload);
    return result;
};

const files = {

    method: 'GET',
    path: '/files/{file_id}',
    
    handler: function(request, h) {

        // construct the URI
        const uri = Config.uri + 'files/' + encodeURIComponent(request.params.file_id);

        // construct the cacheKey
        const cacheKey = Utils.createCacheKey(uri);

        let result;
        if (request.query.refreshCache) {

            result = getResult(uri)
            if (result) {
        
                // getResult succeeded
                utils.updateCache(Cache, cacheKey, result);
                return result;
            }
            else {
                
                // getResult failed, so check if result 
                // exists in cache
                result = Cache.getSync(cacheKey)
                if (result) {
        
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

            result = Cache.getSync(cacheKey);
            if (result) {
        
                // return result from cache
                return result;
            }
            else {

                result = getResult(uri)
                if (result) {
                    updateCache(Cache, cacheKey, result);
                    return result;
                }
                else {
                    return Utils.errorMsg;
                }
            }
        }
    },

    config: {
        description: "fetch files from Zenodo",
        tags: ['file', 'api'],
        plugins: {
            'hapi-swagger': {
                order: 4,
                responseMessages: ResponseMessages
            }
        },
        validate: Schema.files,
        notes: [
            'Files inside Zenodo records',
        ]
    },
};

module.exports = files;