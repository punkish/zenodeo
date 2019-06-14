const path = require('path');
const cwd = process.cwd();

module.exports = {
    
    'info': { 
        'title': 'Zenodeo API documentation for BLR',
        'description': '`nodejs` interface to the Zenodo/BLR community collection',
        'version': '2.0.0',
        'termsOfService': '/tos',
        'contact': { 
            'name': 'Puneet Kishor',
            'url': 'https://punkish.org/About',
            'email': 'punkish@plazi.org' 
        },
        'license': { 
            'name': 'CC0 Public Domain Dedication',
            'url': 'https://creativecommons.org/publicdomain/zero/1.0/legalcode' 
        } 
    },
    'cache': {
        'path': path.join(cwd, 'cache'),
        'v1': {
            'name': 'persistent',
        },
        'v2': {
            'name': 'catbox',
        }
    },
    'uri': {
        'local': 'http://localhost:3000',
        'remote': 'https://zenodo.org/api'
    },
    'download-program': {
        "newTreatmentsDir": path.join(cwd, 'data', 'treatmentsNew'), 
        "treatmentsListDir": path.join(cwd, 'data'),
        "treatmentsListFilename": "listOfTreatments.xml",
        "downloadTreatmentsURL": 'http://tb.plazi.org/GgServer/xml/',
        "downloadListURL": 'http://tb.plazi.org/GgServer/search?&indexName=0&resultFormat=XML&lastModifiedSince='
    },
    'swaggered-scheme': ['http'],
    'port': 3030,
    
    'v1': {
        'cache': {
            'path': path.join(cwd, 'cache'),
            'name': 'persistent'
        },
        'dataDict': path.join(cwd, 'dataDictionary', 'data-dictionary.js'),
        'schema': path.join(cwd, 'api', 'v1', 'schema.js')
    },

    'v2': {
        'cache': {
            'path': path.join(cwd, 'cache'),
            'name': 'catbox'
        },
        'dataDict': path.join(cwd, 'dataDictionary', 'data-dictionary.js'),
        'schema': path.join(cwd, 'api', 'v2', 'schema.js')
    },

    'xmlDumpSrc': 'http://tb.plazi.org/GgServer/dumps/plazi.xml.zip',
    'xmlDumpDir': path.join(cwd, 'data', 'treatmentsDump'),
    'dataDict': path.join(cwd, 'dataDictionary', 'data-dictionary.js'),
    //'xmlDumpDir': path.join(cwd, 'data', 'treatmentsDump'),
    //'xmlDumpSrc': 'http://tb.plazi.org/GgServer/dumps/plazi.xml.zip',
    'xmlRearrangedDest': path.join(cwd, 'data', 'treatments'),
    'logger': path.join(cwd, 'lib', 'logger.js'),
    'logfields': [
        {'col': 'host', 'type': 'TEXT'},
        {'col': 'start', 'type': "INTEGER DEFAULT (strftime('%s', 'now'))"},
        {'col': 'end', 'type': "INTEGER DEFAULT (strftime('%s', 'now'))"},
        {'col': 'status', 'type': 'TEXT'},
        {'col': 'resource', 'type': 'TEXT'},
        {'col': 'query', 'type': 'TEXT'},
        {'col': 'message', 'type': 'TEXT'}
    ],
    'httpStatusCodes': path.join(cwd, 'lib', 'httpStatusCodes.js'),
    'data': {
        'logs': path.join(cwd, 'data', 'logs.sqlite'),
        'treatments': path.join(cwd, 'data', 'treatments.sqlite'),
        'authors': path.join(cwd, 'data', 'authors'),
        'keywords': path.join(cwd, 'data', 'keywords'),
        'taxa': path.join(cwd, 'data', 'taxa.min'),
        'families': path.join(cwd, 'data', 'families.min'),
    },

    

    // 'cacheBase': '/Users/punkish/Projects/zenodeo/cache',
    // 'uri': {
    //     'local': 'http://localhost:3000',
    //     'remote': 'https://zenodo.org/api',
    //     'tb': 'http://tb.plazi.org/GgServer/xml/'
    // },
    // 'index': {
    //     'cacheName': 'diskCache',
    //     'cachePath': '/Users/punkish/Projects/catbox/diskCache',
    //     'info': { 
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
    // 'api': {
    //     'v1': {
    //         'utils': {
    //             'authors': '../../data/authors',
    //             'keywords': '../../data/keywords'
    //         },
    //         'routes': {
    //             cacheBase: '/Users/punkish/Projects/zenodeo/cache',
    //             'treatments': {
    //                 'sqliteDatabase': './data/plazi.sqlite'
    //             }
    //         }
    //     },
    //     'v2': {
    //         'utils': {
    //             'authors': '../../data/authors',
    //             'keywords': '../../data/keywords'
    //         },
    //         'routes': {
    //             'treatments': {
    //                 'sqliteDatabase': './data/plazi.sqlite'
    //             }
    //         }
    //     }
    // },
    // 'bin': {
    //     'renew': {
    //         //'xmlDumpDir': './data/treatmentsDump',
    //         // 'download': {
    //         //     'downloadDir': 'data/treatments',
    //         //     'fileName': 'plazi.xml.zip',
    //         //     'host': 'tb.plazi.org',
    //         //     'port': 80,
    //         //     'pathToFile': '/GgServer/dumps/'
    //         // },
    //         // 'parsex': {
    //         //     'xmlDumpDir': './data/treatmentsDump'
    //         // },
    //         // 'database': {
    //         //     'sqliteDatabase': './data/plazi.sqlite',
    //         //     'logDatabase': './data/logs.sqlite'
    //         // },
    //         // 'rearrangefiles': {
    //         //     'srcdir': 'data/treatmentsDump',
    //         //     'destdir': 'data/treatments'
    //         // }
    //     }
    // }
}