const Wreck = require('wreck');
const Schema = require('../schema.js');

module.exports = {
    plugin: {
        name: 'communities2',
        register: async function(server, options) {

            const communitiesCache = server.cache({
                cache: options.cacheName,
                expiresIn: options.expiresIn,
                generateTimeout: options.generateTimeout,
                segment: 'communities2', 
                generateFunc: async (name) => { return await getCommunities(name); },
                getDecoratedValue: options.getDecoratedValue
            });

            // binds communitiesCache to every route registered  
            // **within this plugin** after this line
            server.bind({ communitiesCache });

            server.route([
                { 
                    path: '/communities', 
                    method: 'GET', 
                    config: {
                        description: "Retrieve communities and their description by their names",
                        tags: ['biosyslit', 'belgiumherbarium', 'communities', 'api'],
                        plugins: {
                            'hapi-swagger': {
                                order: 2,
                                //responseMessages: ResponseMessages
                            }
                        },
                        validate: Schema.communities,
                        notes: [
                            'A Zenodo community groups records based on discipline, objective, shared interests, or any other criteria established by the creators of the community.',
                        ]
                    },
                    handler 
                }
            ]);
        },
    },
};

const handler = async function(request, h) {
    
    let name = request.query.name;
    
    // if (request.query.name) {
    //     name = 'name=' + request.query.name;
    // }

    if (request.query.refreshCache) {
        await this.communitiesCache.drop(name);
    }

    // uses the bound communitiesCache instance from index.js
    return await this.communitiesCache.get(name); 

    
};

const getCommunities = async (name) => {

    let Zenodo = 'https://zenodo.org/api/communities/';

    if (name === 'all') {
        const {res, payload} =  await Wreck.get(Zenodo);
        const result = await JSON.parse(payload);
    
        const validCommunities = ['biosyslit', 'belgiumherbarium'];
    
        const communities = result.hits.hits.filter(c => {
            validCommunities.indexOf(c.id) > -1
        });
        console.log(communities)
        return communities;
    }
    else {
        Zenodo = Zenodo + name;

        const {res, payload} =  await Wreck.get(Zenodo);
        return await JSON.parse(payload);
    }
    
};