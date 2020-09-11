'use strict';

/**************************************************************
 * 
 * The config options start with all the values in this file
 * 
 **************************************************************/

const path = require('path');
const cwd = process.cwd();

module.exports = {

    /* This is the internal URI info ***********************/

    // The internal scheme is *always* 'http', so 
    // no need to configure it
    /* scheme: 'http', */

    // The internal host is *always* 'localhost' so
    // no need to configure it
    /* host: 'localhost', */

    // The port can change depending on the server
    port: 3030,
    root: 'http://localhost:3030',
    
    loglevel: 'INFO',
    
    // API info that is used in the /docs pages by hapi-swaggered.
    // Note: this info is supplemented with info from package.json
    info: {
        title: 'API documentation',
        termsOfService: '/tos',
        license: {
            name: 'CC0 Public Domain Dedication',
            url: 'https://creativecommons.org/publicdomain/zero/1.0/legalcode' 
        } 
    },

    'swaggered-scheme': [ 'http' ],

    // all queries that take longer than the 
    // following (in ms) are displayed in red
    // in the console log
    logSlowSQLthreshold: 300,

    v1: {
        cache: {
            path: path.join(cwd, 'cache'),
            name: 'persistent',
            on: true
        },

        // These are the external URIs
        uri: {
            zenodeo: 'http://localhost:3030/v1',
            zenodo: 'https://zenodo.org/api'
        },
        
        dataDict: path.join(cwd, 'dataDictionary', 'data-dictionary.js'),
        schema: path.join(cwd, 'api', 'v1', 'schema.js')
    },

    v2: {
        cache: {
            path: path.join(cwd, 'cache'),
            name: 'catbox',
            on: false,

            // expires in 1440 mins, or one day
            expiresIn: 60 * 1000 * 1440,
            generateTimeout: false,
            getDecoratedValue: true
        },

        uri: {
            zenodeo: 'http://localhost:3030/v2',
            zenodo: 'https://zenodo.org/api'
        },
        
        //dataDict: path.join(cwd, 'dataDictionary', 'data-dictionary.js'),
        dataDict: path.join(cwd, 'api', 'v2', 'lib', 'dd2datadictionary.js'),

        schema: path.join(cwd, 'api', 'v2', 'schema.js')

    },

    data: {
        logs: path.join(cwd, 'data', 'logs.sqlite'),
        treatments: path.join(cwd, 'data', 'treatments.sqlite'),
        treatmentsTmp: path.join(cwd, 'data', 'treatments-tmp.sqlite'),
        queryStats: path.join(cwd, 'data', 'queryStats.sqlite'),
        lookups: path.join(cwd, 'data', 'facets.sqlite'),

        // The following are legacy files used by API v1
        authors: path.join(cwd, 'data', 'authors'),
        keywords: path.join(cwd, 'data', 'keywords'),
        taxa: path.join(cwd, 'data', 'taxa.min'),
        families: path.join(cwd, 'data', 'families.min')

    },

    httpStatusCodes: path.join(cwd, 'lib', 'httpStatusCodes.js'),
    plog: path.join(cwd, 'lib', 'plog.js'),
    logger: path.join(cwd, 'lib', 'logger.js'),
    logfields: [
        { col : 'host', type: 'TEXT' },
        { col : 'start', type: "INTEGER DEFAULT (strftime('%s', 'now'))" },
        { col : 'end', type: "INTEGER DEFAULT (strftime('%s', 'now'))" },
        { col : 'status', type: 'TEXT' },
        { col : 'resource', type: 'TEXT' },
        { col : 'query', type: 'TEXT '},
        { col : 'message', type: 'TEXT' }
    ],

    // 'download-program': {
    //     "newTreatmentsDir": path.join(cwd, 'data', 'treatmentsNew'), 
    //     "treatmentsListDir": path.join(cwd, 'data'),
    //     "treatmentsListFilename": "listOfTreatments.xml",
    //     "downloadTreatmentsURL": 'http://tb.plazi.org/GgServer/xml/',
    //     "downloadListURL": 'http://tb.plazi.org/GgServer/search?&indexName=0&resultFormat=XML&lastModifiedSince='
    // },

    // 'xmlDumpSrc': 'http://tb.plazi.org/GgServer/dumps/plazi.xml.zip',
    // 'xmlDumpDir': path.join(cwd, 'data', 'treatmentsDump'),
    // 'dataDict': path.join(cwd, 'dataDictionary', 'data-dictionary.js'),
    //'xmlDumpDir': path.join(cwd, 'data', 'treatmentsDump'),
    //'xmlDumpSrc': 'http://tb.plazi.org/GgServer/dumps/plazi.xml.zip',
    //'xmlRearrangedDest': path.join(cwd, 'data', 'treatments'),

    
    // http://tb.plazi.org/GgServer/srsStats/stats?outputFields=doc.uuid+doc.zenodoDepId+doc.updateUser+doc.updateDate&groupingFields=doc.uuid+doc.zenodoDepId+doc.updateUser+doc.updateDate&orderingFields=doc.updateDate&FP-doc.updateDate=%222020-02-21%22-&format=JSON



    // http://tb.plazi.org/GgServer/srsStats/stats?outputFields=doc.uuid+doc.updateDate&groupingFields=doc.uuid+doc.updateDate&orderingFields=doc.updateDate&FP-doc.updateDate=%222020-02-21%22-&format=JSON

    truebug: {
        
        //hostname: 'http://tb.plazi.org/GgServer',
        hostname: 'http://127.0.0.1',

        downloads: {

            //full: 'plazi.zenodeo.zip',
            // example: 'http://tb.plazi.org/GgServer/dumps/plazi.zenodeo.zip'
            full: 'plazi/data/test.zip',

            // diff
            // example 'http://tb.plazi.org/GgServer/srsStats/stats?outputFields=doc.uuid+doc.updateDate&groupingFields=doc.uuid+doc.updateDate&orderingFields=doc.updateDate&format=JSON&FP-doc.updateDate=%222020-07-03%22'
            //diff: '/srsStats/stats?outputFields=doc.uuid+doc.updateDate&groupingFields=doc.uuid+doc.updateDate&orderingFields=doc.updateDate&format=JSON&FP-doc.updateDate=',
            diff: 'plazi/data/diff.txt',
            

            // single download: '8C2D95A59531F2DCB34D5040E36E6566'
            // example 'http://tb.plazi.org/GgServer/xml/8C2D95A59531F2DCB34D5040E36E6566'
            single: 'xml'
        },


        // treatmentsDump: path.join(cwd, 'data', 'treatmentsDump')
        treatmentsDump: path.join(cwd, 'data', 'testDump')
        
    }
    
};