const Wreck = require('wreck');

const ResponseMessages = require('../../responseMessages');
const Utils = require('../utils.js');
const Cache = Utils.cache('root')

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
        name: 'biosyslit',
        register: async function(server, options) {

            server.route([{ 
                path: '/', 
                method: 'GET', 
                config: {
                    description: "The API root of the 'biosyslit' community at Zenodo",
                    tags: ['biosyslit', 'communities', 'api'],
                    plugins: {
                        'hapi-swagger': {
                            order: 1,
                            responseMessages: ResponseMessages
                        }
                    },
                    validate: {},
                    notes: [
                        'A community to share publications related to bio-systematics. The goal is to provide open access to publications cited in publications or in combination with scientific names a digital object identifier (DOI) to enable citation of the publications including direct access to its digital representation. For additional search functionality  can be used. This includes also searches in CrossRef, DataCite, PubMed, RefBank, GNUB and Mendeley.',
                    ]
                },
                handler: async function(request, h) {
                    
                    const [ cacheKey, uri ] = Utils.makeUriAndCacheKey(request, '/')

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