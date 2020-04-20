const Wreck = require('@hapi/wreck');
const Schema = require('../schema.js');

const ResponseMessages = require('../../responseMessages');
const Utils = require('../utils.js');
const Cache = Utils.cache('record')

const getResult = async function(uri, getImages, cacheKey) {

    let result = await getRemoteData(uri);

    if (getImages) {
        const imagesPayload = await getRemoteData(result.links.bucket);
        let images = [];
        imagesPayload.contents.forEach(function(element) {
            images.push(element.links.self);
        });

        result = images;
    }

    if (Cache.getSync(cacheKey)) {
        Cache.deleteSync(cacheKey)
    }

    Cache.putSync(cacheKey, result)
    return result;
};

const getRemoteData = async function(uri) {

    const { res, payload } = await Wreck.get(uri);
    return JSON.parse(payload);
};

module.exports = {
    plugin: {
        name: 'record',
        register: async function(server, options) {
            server.route([{
                path: '/record/{id}',
                method: 'GET',
                config: {
                    description: "fetch a single record from Zenodo",
                    tags: ['record', 'api'],
                    plugins: {
                        'hapi-swagger': {
                            order: 2,
                            responseMessages: ResponseMessages
                        }
                    },
                    validate: {
                        params: Schema.record.params,
                        query: Schema.record.query,
                        failAction: (request, h, err) => {
                            throw err;
                            return;
                        }
                    },
                    notes: [
                        'This is the main route for fetching a record matching an id or a set of records matching the provided query parameters.'
                    ]
                },
                handler: function(request, h) {

                    const [ cacheKey, uri ] = Utils.makeUriAndCacheKey(request, 'record')

                    if (request.query.refreshCache) {
                        return getResult(uri, request.query.images, cacheKey)
                    }
                    else {
                        return (Cache.getSync(cacheKey) || getResult(uri, request.query.images, cacheKey))
                    }
            
                }
            }])
        }
    }
};