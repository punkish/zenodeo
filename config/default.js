const path = require('path');
const cwd = process.cwd();

module.exports = {
    
    "info": { 
        "title": 'Zenodeo API documentation for BLR',
        "description": '`nodejs` interface to the Zenodo/BLR community collection',
        "version": '2.0.0',
        "termsOfService": '/tos',
        "contact": { 
            "name": 'Puneet Kishor',
            "url": 'https://punkish.org/About',
            "email": 'punkish@plazi.org' 
        },
        "license": { 
            "name": 'CC0 Public Domain Dedication',
            "url": 'https://creativecommons.org/publicdomain/zero/1.0/legalcode' 
        } 
    },
    "cache": {
        "path": "/Users/punkish/Projects/zenodeo/cache",
        "v1": {
            "name": "persistent",
        },
        "v2": {
            "name": "catbox",
        }
    },
    "uri": {
        "local": "http://localhost:3000",
        "remote": "https://zenodo.org/api",
        "tb": "http://tb.plazi.org/GgServer/xml/"
    },
    "swaggered-scheme": ['http'],
    "port": 3030,
    // "cacheBase": "/Users/punkish/Projects/zenodeo/cache",
    // "uri": {
    //     "local": "http://localhost:3000",
    //     "remote": "https://zenodo.org/api",
    //     "tb": "http://tb.plazi.org/GgServer/xml/"
    // },
    // "index": {
    //     "cacheName": "diskCache",
    //     "cachePath": "/Users/punkish/Projects/catbox/diskCache",
    //     "info": { 
    //         title: 'Zenodeo API documentation for BLR',
    //         description: '`nodejs` interface to the Zenodo/BLR community collection',
    //         version: '2.0.0',
    //         termsOfService: '/tos',
    //         contact: { 
    //             name: 'Puneet Kishor',
    //             url: 'https://punkish.org/About',
    //             email: 'punkish@plazi.org' 
    //         },
    //         license: { 
    //             name: 'CC0 Public Domain Dedication',
    //             url: 'https://creativecommons.org/publicdomain/zero/1.0/legalcode' 
    //         } 
    //     }
    // },

 
    'dataDict': path.join(cwd, 'dataDictionary', 'data-dictionary.js'),
    'xmlDumpDir': path.join(cwd, 'data', 'treatmentsDump'),
    'logger': path.join(cwd, 'lib', 'logger.js'),
    'logfields': ['host', 'start', 'end', 'status', 'resource', 'query', 'message'],
    "data": {
        'logs': path.join(cwd, 'data', 'logs.sqlite'),
        'treatments': path.join(cwd, 'data', 'treatments.sqlite'),
        //"db": "plazi.sqlite",
        "authors": "../../data/authors",
        "keywords": "../../data/keywords",
        "taxa": "../../data/taxa.min",
        "families": "../../data/families.min",
        "sqliteDatabase": "./data/plazi.sqlite"
    },
    // "api": {
    //     "v1": {
    //         "utils": {
    //             "authors": "../../data/authors",
    //             "keywords": "../../data/keywords"
    //         },
    //         "routes": {
    //             cacheBase: '/Users/punkish/Projects/zenodeo/cache',
    //             "treatments": {
    //                 "sqliteDatabase": "./data/plazi.sqlite"
    //             }
    //         }
    //     },
    //     "v2": {
    //         "utils": {
    //             "authors": "../../data/authors",
    //             "keywords": "../../data/keywords"
    //         },
    //         "routes": {
    //             "treatments": {
    //                 "sqliteDatabase": "./data/plazi.sqlite"
    //             }
    //         }
    //     }
    // },
    "bin": {
        "renew": {
            "xmlDumpDir": "./data/treatmentsDump",
            "download": {
                "downloadDir": "data/treatments",
                "fileName": "plazi.xml.zip",
                "host": "tb.plazi.org",
                "port": 80,
                "pathToFile": "/GgServer/dumps/"
            },
            "parsex": {
                "xmlDumpDir": "./data/treatmentsDump"
            },
            "database": {
                "sqliteDatabase": "./data/plazi.sqlite",
                "logDatabase": "./data/logs.sqlite"
            },
            "rearrangefiles": {
                "srcdir": "data/treatmentsDump",
                "destdir": "data/treatments"
            }
        }
    }
}