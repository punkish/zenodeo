'use strict';

const Wreck = require('wreck');
const ResponseMessages = require('../../responseMessages');
const debug = require('debug')('v2:images');
const Config = require('config');
const Zenodo = Config.get('uri.remote') + '/records/';

module.exports = {

    plugin: {
        name: 'images2',
        register: async function(server, options) {

            const imagesCache = server.cache({
                cache: options.cacheName,
                expiresIn: options.expiresIn,
                generateTimeout: options.generateTimeout,
                segment: 'images2', 
                generateFunc: async (query) => { return await getImages(query) },
                getDecoratedValue: options.getDecoratedValue
            });

            // binds imagesCache to every route registered  
            // **within this plugin** after this line
            server.bind({ imagesCache });

            server.route([{ 
                path: '/images', 
                method: 'GET', 
                config: {
                    description: "Fetch images from Zenodo",
                    tags: ['images', 'api'],
                    plugins: {
                        'hapi-swagger': {
                            order: 4,
                            responseMessages: ResponseMessages
                        }
                    },
                    //validate: Schema.images,
                    notes: [
                        'This is the main route for fetching images matching the provided query parameters.',
                    ]
                },
                handler 
            }]);
        },
    },
};

const getStats = async function(query) {

    const statistics = {};

    const uri = Zenodo + query;

    try {
        debug('querying ' + uri);
        const {res, payload} =  await Wreck.get(uri);
        const data = await JSON.parse(payload);
        const byAccessRight = data.aggregations.access_right.buckets;
        const byKeywords = data.aggregations.keywords.buckets;
        byAccessRight.forEach(k => {
            statistics[k.key] = k.doc_count;
        });

        
        return statistics;
    }
    catch(err) {
        console.error(err);
        return {error: err}
    }
};

const queryMaker = function(request) {

    let hrefArray = [];
    for (let p in request.query) {
        if (p !== 'refreshCache') {
            hrefArray.push(p + '=' + request.query[p]);
        }
    }

    return hrefArray.sort().join('&');
}

const getImages = async (queryStr) => {

    const qryObj = {};
    queryStr.split('&').forEach(el => { 
        const a = el.split('='); 
        qryObj[ a[0] ] = a[1]; 
    });

    //let Zenodo = 'https://zenodo.org/api/records/';
    let uri = Zenodo;

    if (qryObj.stats) {

        // '?communities=biosyslit&type=image&access_right=open'
        const statistics = await getStats('?communities=biosyslit');
        return statistics;
        
    }
    else if (qryObj.id) {
        uri += qryObj.id;

        try {
            debug('querying ' + uri);
            const {res, payload} =  await Wreck.get(uri);
            return await JSON.parse(payload);
        }
        catch(err) {
            console.error(err);
            return {error: err}
        }
    }
    else {
        uri = Zenodo + '?' + queryStr + '&type=image&access_right=open';

        const limit = 30;

        try {
            debug('querying ' + uri);
            const {res, payload} =  await Wreck.get(uri);
            const result = await JSON.parse(payload);
            const total = result.hits.total;
            const images = result.hits.hits;
            const num = images.length;


            const byAccessRight = result.aggregations.access_right.buckets;
            const byKeywords = result.aggregations.keywords.buckets;
            const statistics = {};
            byKeywords.forEach(k => {
                statistics[k.key] = k.doc_count;
            });

            const page = qryObj.page ? parseInt(qryObj.page) : 0;
            //const offset = page * 30;

            const from = (page * 30) + 1;
            const to = num < limit ? from + num - 1 : from + limit - 1;

            let imagesOfRecords = {};
            if (total) {

                debug(`found ${total} open records… now getting their images`);
                debug(`number of images: ${images.length}`);
    
                await Promise.all(images.map(async (record) => {
                    
                    const bucket = await getBuckets(record.links.self);
                    
                    let contents;
                    if (bucket) {
                        contents = await getImageFiles(bucket);
                        imagesOfRecords[record.links.self] = {
                            title: record.metadata.title,
                            creators: record.metadata.creators,
                            images: contents.map(el => { return el.links.self }),
                            thumb250: record.links.thumb250 ? record.links.thumb250 : 'na'
                        };
                    }
                    
                }));

                return {
                    previd: page >= 1 ? page - 1 : '',
                    nextid: num < limit ? '' : parseInt(page) + 1,
                    recordsFound: total,
                    from: from,
                    to: to,
                    images: imagesOfRecords,
                    statistics: statistics,
                    whereCondition: qryObj
                };
            }
            else {
                debug('nothing found');
                return {recordsFound: 0, images: imagesOfRecords};
            }
        }
        catch(err) {
            console.error(err);
            return {error: err}
        }
    }
    
};

const getImageFiles = async function(uri) {
    const { res, payload } = await Wreck.get(uri);
    return JSON.parse(payload.toString()).contents;
};

const getBuckets = async function(uri) {
    const { res, payload } = await Wreck.get(uri);
    return JSON.parse(payload.toString()).links.bucket;
};

const handler = async function(request, h) {

    let query;

    // ignore all other query params if id is present
    if (request.query.id) {
        query = 'id=' + request.query.id;
    }
    else if (request.query.count) {
        query = 'stats=true';
    }
    else {
        query = queryMaker(request);
    }

    if (request.query.refreshCache === 'true') {
        debug('forcing refreshCache')
        await this.imagesCache.drop(query);
    }

    // uses the bound imagesCache instance from index.js
    return await this.imagesCache.get(query); 
};