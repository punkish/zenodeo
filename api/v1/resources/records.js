const Wreck = require('wreck');
const Schema = require('../schema.js');

const ResponseMessages = require('../../responseMessages');
const Utils = require('../utils.js');
const Debug = require('debug')('v1: records');
const Cache = Utils.cache('records')

/*
The payload looks like so
    
{
    "aggregations": {
        "access_right": { … },
        "file_type": { … },
        "keywords": { … },
        "type": { … }
    },
    "hits": {
        "hits": [
            {
                "conceptdoi": "10.5281/zenodo.1168647", 
                "conceptrecid": "1168647", 
                "created": "2018-02-07T18:50:09.513011+00:00", 
                "doi": "10.5281/zenodo.1168648", 
                "id": 1168648, 
                "links": {
                    "badge": "https://zenodo.org/badge/doi/10.5281/zenodo.1168648.svg", 
                    "bucket": "https://zenodo.org/api/files/b41da27b-ee34-4259-90b4-ab08c25b533c", 
                    "conceptbadge": "https://zenodo.org/badge/doi/10.5281/zenodo.1168647.svg", 
                    "conceptdoi": "https://doi.org/10.5281/zenodo.1168647", 
                    "doi": "https://doi.org/10.5281/zenodo.1168648", 
                    "html": "https://zenodo.org/record/1168648", 
                    "latest": "https://zenodo.org/api/records/1168648", 
                    "latest_html": "https://zenodo.org/record/1168648", 
                    "self": "https://zenodo.org/api/records/1168648", 
                    "thumb250": "https://zenodo.org/api/iiif/v2/b41da27b-ee34-4259-90b4-ab08c25b533c:8dbadf2e-cc29-4dfc-9473-f26fa775e720:figure.png/full/250,/0/default.png"
                }, 
                "metadata": {
                    "access_right": "open", 
                    "access_right_category": "success", 
                    "communities": [
                        { "id": "biosyslit" },
                        …
                    ], 
                    "creators": [
                        { "name": "Cedric A. Collingwood" }, 
                        { "name": "Donat Agosti" }, 
                        …
                    ], 
                    "description": "Plates 73\u201376.….", 
                    "doi": "10.5281/zenodo.1168648", 
                    "journal": {
                        "pages": "1-70", 
                        "title": "Arthropod fauna of the UAE", 
                        "volume": "4"
                    }, 
                    "keywords": [
                        "Biodiversity", 
                        "Taxonomy", 
                        "Animalia", 
                        "Arthropoda", 
                        "Insecta", 
                        "Hymenoptera", 
                        "Formicidae", 
                        "Tetramorium"
                    ], 
                    "license": {
                        "id": "notspecified"
                    }, 
                    "publication_date": "2011-05-31", 
                    "related_identifiers": [
                        {
                            "identifier": "http://treatment.plazi.org/id/1A4C094D372BFFF0ED69A7641865EBD5", 
                            "relation": "isCitedBy", 
                            "scheme": "url"
                        }, 
                        {
                            "identifier": "10.5281/zenodo.1168586", 
                            "relation": "isPartOf", 
                            "scheme": "doi"
                        }, 
                        {}
                    ], 
                    "relations": {
                        "version": [
                            {
                                "count": 1, 
                                "index": 0, 
                                "is_last": true, 
                                "last_child": {
                                    "pid_type": "recid", 
                                    "pid_value": "1168648"
                                }, 
                                "parent": {
                                    "pid_type": "recid", 
                                    "pid_value": "1168647"
                                }
                            }
                        ]
                    }, 
                    "resource_type": {
                        "subtype": "figure", 
                        "title": "Figure", 
                        "type": "image"
                    }, 
                    "title": "Plates 73\u201376. Tetramorium latinode Collingwood & Agosti. 73 in Order Hymenoptera, family Formicidae"
                }, 
                "owners": [ 1161 ], 
                "revision": 1, 
                "updated": "2018-02-07T18:50:09.877875+00:00"
            },
            {},
        ],
        total: 102
    },
    "links": {
        "next": "https://zenodo.org/api/records/?sort=bestmatch&q=agosti&communities=biosyslit&type=image&page=2&size=30", 
        "self": "https://zenodo.org/api/records/?sort=bestmatch&q=agosti&communities=biosyslit&type=image&page=1&size=30"
    }
}
*/

const getResult = async function(uri, images, summary, cacheKey) {
    Debug(`uri: ${uri}`);
    Debug(`images: ${images}`);
    Debug(`summary: ${summary}`);

    let result;

    if (images) {
        Debug('getting images');
        try {
            result = await getImages(uri);

            if (Cache.getSync(cacheKey)) {
                Cache.deleteSync(cacheKey)
            }
        
            Cache.putSync(cacheKey, result)
            return result;
        }
        catch(err) {
            console.error(err);
        }       
        
    }

    if (summary) {
        Debug('getting summary');
        try {
            result = await getSummaryOfRecords(uri);

            if (Cache.getSync(cacheKey)) {
                Cache.deleteSync(cacheKey)
            }
        
            Cache.putSync(cacheKey, result)
            return result;
        }
        catch(err) {
            console.error(err);
        }
    }
};

const getImageFiles = async function(uri) {

    const { res, payload } = await Wreck.get(uri);
    const contents = JSON.parse(payload.toString()).contents;
    return contents;
};

const getBuckets = async function(record) {

    const { res, payload } = await Wreck.get(record.links.self);
    const bucket = JSON.parse(payload.toString()).links.bucket;
    return bucket;
};

const getImages = async function(uri) {

    Debug(`searching for ${uri}`);

    const { res, payload } = await Wreck.get(uri);
    const result =  JSON.parse(payload);

    let total = result.hits.total;

    if (total) {

        Debug(`found ${total} open records… now getting their images`);
        Debug(`number of hits: ${result.hits.hits.length}`);

        let imagesOfRecords = {};
        await Promise.all(result.hits.hits.map(async (record) => {
            const bucket = await getBuckets(record);
            const contents = await getImageFiles(bucket);
            imagesOfRecords[record.links.self] = {
                title: record.metadata.title,
                creators: record.metadata.creators,
                images: contents.map(function(el) {
                    return el.links.self;
                }),
                thumb250: record.links.thumb250 ? record.links.thumb250 : 'na'
            };
        }));

        const data = {
            uri: uri,
            total: total,
            result: imagesOfRecords
        };

        return data;
    }
    else {
        Debug('nothing found');
        return Utils.errorMsg;
    }

};

const getSummaryOfRecords = async function (uri) {
    
    const { res, payload } = await Wreck.get(uri);
    const summary = JSON.parse(payload)
        .hits
        .hits
        .map(function(element) {
            return element.links.self;
        });

    return summary;
};

module.exports = {
    plugin: {
        name: 'records',
        register: async function(server, options) {
            server.route([{
                path: "/records",
                method: 'GET',
                config: {
                    description: "fetch records from Zenodo",
                    tags: ['record', 'api'],
                    plugins: {
                        'hapi-swagger': {
                            order: 3,
                            responseMessages: ResponseMessages
                        }
                    },
                    validate: Schema.records,
                    notes: [
                        'This is the main route for fetching records matching the provided query parameters.'
                    ]
                },
                handler: function(request, h) {

                    const [ cacheKey, uri ] = Utils.makeUriAndCacheKey(request, 'records')

                    const getImages = request.query.images || false;
                    const getSummary = request.query.summary || false;

                    if (request.query.refreshCache) {
                        return getResult(uri, getImages, getSummary, cacheKey)
                    }
                    else {
                        return (Cache.getSync(cacheKey) || getResult(uri, getImages, getSummary, cacheKey))
                    }

                }
            }]);
        }
    }
};