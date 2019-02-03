//const Wreck = require('wreck');
const Schema = require('../schema.js');
const Config = require('../../../config.js');
const ResponseMessages = require('../../response-messages');
const Utils = require('../utils.js');
// const xml2js = require('xml2js');
// const Database = require('better-sqlite3');
const Debug = require('debug')('v2: treatment');

// const parser = new xml2js.Parser();
// const db = new Database('data/tb-new.sqlite');
// const selectStmt = db.prepare('SELECT xml FROM treatments WHERE treatment_id = ?');

// const newQuery = async function(ZenodoUri, zenodeoUri) {
//     Debug(`getting result for ${ZenodoUri}`);
    
//     const { res, payload } = await Wreck.get(ZenodoUri);
//     return payload;
// };

// const addToCache = function(treatment_id, zenodeoUri, payload) {
//     return new Promise(function (resolve, reject) {
//         parser.parseString(payload, function (err, result) {
//             if (err) {
//                 reject(err)
//             }
//             if (result.document.treatment) {

//                 data['treatment_id'] = treatment_id;
//                 data['LSID'] = result.document.treatment[0]['$']['LSID'];
//                 data['httpUri'] = result.document.treatment[0]['$']['httpUri'];
//                 data['subSubSection'] = JSON.stringify(result.document.treatment[0]['subSubSection']);

//                 for (let i in data) {
//                     if (i in result.document['$']) {
//                         data[i] = result.document['$'][i];
//                     }
//                 }

//                 insertStmt.run(data);
//                 resolve(data);
//             }
//         });
//     })
// }

// const updateCache = function(treatment_id, zenodeoUri, payload) {

//     // check if result already exists in cache
//     if (selectStmt.get(treatment_id)) {
            
//         // delete old cached value  
//         deleteStmt.run(treatment_id)
//     }
    
//     // cache the new result
//     const myPromise = addToCache(treatment_id, zenodeoUri, payload);
//     return myPromise;
// }

const treatment = {
    method: 'GET',
    path: 'treatment/{id}',
    config: {
        description: "fetch treatment XMLs",
        tags: ['treatment', 'api'],
        plugins: {
            'hapi-swagger': {
                order: 6,
                responseMessages: ResponseMessages
            }
        },
        validate: Schema.treatments,
        notes: [
            'This is the main route for fetching a treatment matching an id.'
        ]
    },
    handler: {
        directory: {
            path: `${Config.data}/treatmentxmls`,
            redirectToSlash: true,
            index: true,
            defaultExtension: 'xml'
        }
    }
}

/*
const treatment_old = {
    method: 'GET',
    path: "treatment/{id}",
    handler: async function(request, h) {

        const [ZenodoUri, zenodeoUri, cacheKey] = Utils.makeIncomingUri(request, 'treatment');
        const treatment_id = request.params.id;
        let result;

        if (result = selectStmt.get(treatment_id)) {
            return Utils.packageResult(zenodeoUri, result)
        }
        else {
            return Utils.errorMsg;
        }
        
        // if (request.query.refreshCache) {
        //     result = await newQuery(ZenodoUri, zenodeoUri, treatment_id);
        //     const myPromise = updateCache(treatment_id, zenodeoUri, result);
        //     const res = myPromise
        //         .then(data => Utils.packageResult(zenodeoUri, data))
        //         .catch(error => error);   
        //     return res;         
        // }
        // else {
        //     if (result = selectStmt.get(treatment_id)) {
        //         return Utils.packageResult(zenodeoUri, result)
        //     }
        //     else {
        //         result = newQuery(ZenodoUri, zenodeoUri, treatment_id);
        //         const myPromise = updateCache(treatment_id, zenodeoUri, result);
        //         const res = myPromise
        //             .then(data => Utils.packageResult(zenodeoUri, data))
        //             .catch(error => error);
        //         return res;
        //     }
        // }
        
    },
    config: {
        description: "fetch treatment from TreatmentBank",
        tags: ['treatment', 'api'],
        plugins: {
            'hapi-swagger': {
                order: 6,
                responseMessages: ResponseMessages
            }
        },
        validate: Schema.treatments,
        notes: [
            'This is the main route for fetching a treatment matching an id.'
        ]
    }
};
*/

module.exports = treatment;