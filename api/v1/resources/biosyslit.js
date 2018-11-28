const Wreck = require('wreck');
const Config = require('../../../config.js');
const ResponseMessages = require('../../response-messages');
const Utils = require('../utils.js');
const Cache = Utils.cache('root');

const uri = Config.uri + 'communities/biosyslit';
const cacheKey = Utils.createCacheKey(uri);

const biosyslit = {

    method: 'GET',
    path: '/',

    handler: async function(request, h) {

        let result = Cache.getSync(cacheKey);
        if (result) {

            return result;
        }
        else {
            
            const { res, payload } = await Wreck.get(uri);
            if (payload) {

                result = JSON.parse(payload);
                Cache.putSync(cacheKey, result);
                return result;
            }
            else {
                
                return Utils.errorMsg;
            }
        }
    },

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
    }
};

module.exports = biosyslit;