const Package = require('./package.json');

module.exports = (function(mode) {
    const config = {
        base: {
            uri: 'https://zenodo.org/api',
            zenodo: 'https://zenodo.org/api',
            tb: 'http://tb.plazi.org/GgServer/xml/',
            port: 3030,
            contenttype: 'Content-Type: application/vnd.api+json',
            info: {
                title: 'Zenodeo API documentation for BLR',
                version: '2.0.0',
                description: Package.description,
                termsOfService: '/tos',
                contact: {
                    name: Package.author,
                    url: 'https://punkish.org/About',
                    email: 'punkish@plazi.org'
                },
                license: {
                    name: 'CC0 Public Domain Dedication',
                    url: 'https://creativecommons.org/publicdomain/zero/1.0/legalcode'
                }
            }
        },
        development: {
            schemes: ['http'],
            cache: '/Users/punkish/Projects/zenodeo/cache'
        },
        production: {
            schemes: ['https'],
            cache: '/home/punkish/Nodes/zenodeo/cache'
        }
    };

    let tmp = config[mode || process.env.NODE_ENV || 'development'];
    
    for (let i in config.base) {
        tmp[i] = config.base[i];
    }

    return tmp;
})();
