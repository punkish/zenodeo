const Wreck = require('wreck');
const Schema = require('../schema.js');
const Config = require('../../../config.js');
const ResponseMessages = require('../../response-messages');
const Utils = require('../utils.js');
const Debug = require('debug')('v2: communities');

const Cache = Utils.cache('communities');
const uri = Config.uri + 'communities/biosyslit';

const newQuery = async function(ZenodoUri, zenodeoUri) {
    const {res, payload} =  await Wreck.get(ZenodoUri);
    const result = await JSON.parse(payload);
    return Utils.packageResult(zenodeoUri, result);
};

const communities = {

    method: 'GET',
    path: 'communities/',
    handler:  async function(request, h) {

        const [ZenodoUri, zenodeoUri, cacheKey] = Utils.makeIncomingUri(request, 'communities');
        
        let result;

        // perform a new query only if refreshCache is true
        if (request.query.refreshCache) {
            result = newQuery(ZenodoUri, zenodeoUri);
            Utils.updateCache(Cache, cacheKey, result);
            return result;
        }

        // serve result from cache if it exists in cache
        else {
            if (result = Cache.getSync(cacheKey)) {
                return result;
            }
            else {
                result = newQuery(ZenodoUri, zenodeoUri);
                Utils.updateCache(Cache, cacheKey, result);
                return result;
            }
        }
    },

    config: {
        description: "communities",
        tags: ['biosyslit', 'icedig', 'communities', 'api'],
        plugins: {
            'hapi-swagger': {
                order: 2,
                responseMessages: ResponseMessages
            }
        },
        validate: Schema.communities,
        notes: [
            'A Zenodo community groups records based on discipline, objective, shared interests, or any other criteria established by the creators of the community.',
        ]
    }
};

module.exports = communities;