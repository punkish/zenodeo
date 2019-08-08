const Wreck = require('wreck');
const Schema = require('./schema.js');
const ResponseMessages = require('../responseMessages');

const config = require('config');
// const authors = config.get('data.authors');
// const keywords = config.get('data.keywords');
// const taxa = config.get('data.taxa');
// const families = config.get('data.families');

const Database = require('better-sqlite3');
const db = new Database(config.get('data.facets'));

// const data = {
//     authors: require(authors),
//     keywords: require(keywords),
//     taxa: require(taxa),
//     families: require(families)
// };

const facets = {
    authors: 'author',
    families: 'family',
    keywords: 'keyword',
    taxa: 'taxon'
};



module.exports = {
    // findjs: function(pattern, source) {
    //     const re = new RegExp(`^${pattern}`, 'i');
    //     const res = data[source].filter(function(element) {
    //         return (element.search(re) > -1)
    //     });
    
    //     return(res);
    // },

    find: function(pattern, source) {
        //console.log(`looking for ${pattern} in ${source}`)
        return db.prepare(`SELECT ${facets[source]} FROM ${source} WHERE ${facets[source]} LIKE ?`)
            .raw()
            .all(`%${pattern}%`)
            .map(r => r[0]);
    },
    
    getImages: async function(treatmentId) {
    
        const _getRecords = async (query) => {
    
            let recordId = '';
            if (query.indexOf('id=') > -1) {
                recordId = query.substr(3)
            }
        
            let Zenodo = 'https://zenodo.org/api/records/';
        
            // ignore all other query params if id is present
            if (recordId) {
                Zenodo = Zenodo + recordId;
        
                try {
                    console.log('querying ' + Zenodo);
                    const {res, payload} =  await Wreck.get(Zenodo);
                    return await JSON.parse(payload);
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
        
                    if (total) {
        
                        console.log(`found ${total} open records… now getting their images`);
                        console.log(`number of hits: ${result.hits.hits.length}`);
        
                        let imagesOfRecords = {};
                        await Promise.all(result.hits.hits.map(async (record) => {
                            
                            const bucket = await _getBuckets(record.links.self);
                            if (bucket) {
                                const contents = await _getImageFiles(bucket);
        
                                imagesOfRecords[record.links.self] = {
                                    title: record.metadata.title,
                                    creators: record.metadata.creators,
                                    images: contents.map(function(el) {
                                        return el.links.self;
                                    }),
                                    thumb250: record.links.thumb250 ? record.links.thumb250 : 'na'
                                };
                            }
                            
                        }));
        
                        return {"total": total, "images": imagesOfRecords};
                    }
                    else {
                        console.log('nothing found');
                        return {"total": 0, "images": {}};
                        //return Utils.errorMsg;
                    }
                }
                catch(err) {
                    console.error(err);
                }
            }
            
        };

        const _getImageFiles = async function(uri) {
    
            if (uri) {
                const { res, payload } = await Wreck.get(uri);
                const contents = JSON.parse(payload.toString()).contents;
                return contents;
            }
            
        };
        
        const _getBuckets = async function(uri) {
        
            const { res, payload } = await Wreck.get(uri);
            const bucket = JSON.parse(payload.toString()).links.bucket;
            return bucket;
        };

    
        return await _getRecords(`access_right=open&page=1&q=${treatmentId}&size=30&type=image`);
    }
    
}