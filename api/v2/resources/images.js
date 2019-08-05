const Wreck = require('wreck');
const Schema = require('../schema.js');
const ResponseMessages = require('../../responseMessages');

module.exports = {
    plugin: {
        name: 'images2',
        register: async function(server, options) {

            const recordsCache = server.cache({
                cache: options.cacheName,
                expiresIn: options.expiresIn,
                generateTimeout: options.generateTimeout,
                segment: 'images2', 
                generateFunc: async (query) => { return await getRecords(query) },
                getDecoratedValue: options.getDecoratedValue
            });

            // binds recordsCache to every route registered  
            // **within this plugin** after this line
            server.bind({ recordsCache });

            server.route([
                { 
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
                }
            ]);
        },
    },
};

// const queryMakerOld = function(request) {
//     const queryParams = Object.keys(Schema.images.query);
//     let query = [];

//     // remove 'id' and 'refreshCache' from the queryParams
//     ['id', 'refreshCache'].forEach(el => { queryParams.splice(queryParams.indexOf(el), 1) });
//     const validCommunities = ['biosyslit', 'belgiumherbarium'];

//     for (let i = 0, j = queryParams.length; i < j; i++) {

//         // check communities, and convert it to valid communities if 'all' 
//         // communities are requested in the queryString
//         if (queryParams[i] === 'communities') {

//             if (request.query[queryParams[i]] === 'all') {
//                 validCommunities.forEach( el => query.push('communities=' + el) )
//             }

//         }
//         else {

//             if (request.query[queryParams[i]]) {
//                 query.push(queryParams[i] + '=' + request.query[queryParams[i]])
//             }

//         }
//     }

//     query.sort();
//     return query.join('&')
// };

const queryMaker = function(request) {

    let hrefArray = [];
    for (let p in request.query) {
        if (p !== 'refreshCache') {
            hrefArray.push(p + '=' + request.query[p]);
        }
    }

    return hrefArray.sort().join('&');
}

const handler = async function(request, h) {

    //console.log(request.query);
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
        await this.recordsCache.drop(query);
    }

    // uses the bound recordsCache instance from index.js
    return await this.recordsCache.get(query); 
};

const getRecords = async (query) => {

    let Zenodo = 'https://zenodo.org/api/records/';

    // ignore all other query params if id is present
    if (query.indexOf('id=') > -1) {
        Zenodo = Zenodo + query.substr(3);

        try {
            console.log('querying ' + Zenodo);
            const {res, payload} =  await Wreck.get(Zenodo);
            return await JSON.parse(payload);
        }
        catch(err) {
            console.error(err);
        }
    }
    else if (query.indexOf('stats=true') > -1) {
        Zenodo = Zenodo + '?communities=biosyslit&type=image&access_right=open';

        try {
            console.log('querying ' + Zenodo);
            const {res, payload} =  await Wreck.get(Zenodo);
            return {images: await JSON.parse(payload).hits.total}
        }
        catch(err) {
            console.error(err);
        }
    }
    else {
        Zenodo = Zenodo + '?' + query;

        try {
            console.log('querying ' + Zenodo);
            const {res, payload} =  await Wreck.get(Zenodo);
            const result = await JSON.parse(payload);
            const total = result.hits.total;
            const images = result.hits.hits;

            if (total) {

                console.log(`found ${total} open records… now getting their images`);
                console.log(`number of images: ${images.length}`);

                let imagesOfRecords = {};
                await Promise.all(images.map(async (record) => {
                    
                    const bucket = await getBuckets(record.links.self);
                    const contents = await getImageFiles(bucket);

                    imagesOfRecords[record.links.self] = {
                        title: record.metadata.title,
                        creators: record.metadata.creators,
                        images: contents.map(el => { return el.links.self }),
                        thumb250: record.links.thumb250 ? record.links.thumb250 : 'na'
                    };
                    
                }));

                return {'total': total, 'imagesOfRecords': imagesOfRecords};
            }
            else {
                console.log('nothing found');
                return Utils.errorMsg;
            }
        }
        catch(err) {
            console.error(err);
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