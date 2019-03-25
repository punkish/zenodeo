const Wreck = require('wreck');
const Schema = require('../schema.js');

const ResponseMessages = require('../../responseMessages');
const Utils = require('../utils.js');
const Cache = Utils.cache('files')

const getResult = async function(uri, cacheKey) {

    const { res, payload } = await Wreck.get(uri);

    if (payload) {

        let result = JSON.parse(payload);
        if (Cache.getSync(cacheKey)) {
            Cache.deleteSync(cacheKey)
        }
        Cache.putSync(cacheKey, result)
        return result;
    }
    else {
        
        return Utils.errorMsg;
    }

};

module.exports = {
    plugin: {
        name: 'files',
        register: async function(server, options) {

            server.route([{ 
                path: '/files/{file_id}', 
                method: 'GET', 
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
                handler: async function(request, h) {

                    const [ cacheKey, uri ] = Utils.makeUriAndCacheKey(request, 'files')

                    if (request.query.refreshCache) {
                        return getResult(uri, cacheKey)
                    }
                    else {
                        return (Cache.getSync(cacheKey) || getResult(uri, cacheKey))
                    }
                
                }
            }]);
        },
    },
};