'use strict';

/*************************************************************
 *
 * A route to fetch summary of the given term from the info-
 * box on Wikipedia
 * 
 *************************************************************/

const wiki = require('wikijs').default;

module.exports = {
    
    plugin: {
        name: 'wpsummary',
        register: async function(server, options) {

            const wpCache = server.cache({
                cache: options.cacheName,
                expiresIn: options.expiresIn,
                generateTimeout: options.generateTimeout,
                segment: 'wpsummary', 
                generateFunc: async (q) => { return await wp(q); },
                getDecoratedValue: options.getDecoratedValue
            });

            // binds wpCache to every route registered **within 
            // this plugin** after this line
            server.bind({ wpCache });

            server.route([
                { 
                    path: '/wpsummary', 
                    method: 'GET', 
                    config: {
                        description: "Retrieve summary from the English Wikipedia page",
                        tags: ['wikipedia', 'api'],
                        plugins: {
                            'hapi-swagger': {
                                order: 13,
                            }
                        },
                        notes: [
                            'Summary from the Wikipedia page',
                        ]
                    },
                    handler 
                }
            ]);
        },
    },
};

const handler = async function(request, h) {

    let q = request.query.q;

    if (request.query.refreshCache) {
        await this.wpCache.drop(q);
    }

    // uses the bound wpCache instance from index.js
    return await this.wpCache.get(q); 
};

const wp = async (term) => {

    return await wiki().page(term)
        .then(page => page.summary())
        .then(summary => { return summary })
};