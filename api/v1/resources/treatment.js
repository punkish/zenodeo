const Wreck = require('@hapi/wreck');
const Schema = require('../schema.js');
const config = require('config');
const tb = config.get('tb');

const ResponseMessages = require('../../responseMessages');
const Utils = require('../utils.js');
const xml2js = require('xml2js');
const Database = require('better-sqlite3');

// better messages
// const Boom = require('boom');

const db = new Database('data/tb.sqlite');

let data = {
    treatment_id: '', 
    ID_DOI: '',
    ID_Pensoft_Pub: '',
    ModsDocAuthor: '',
    ModsDocDate: '',
    ModsDocID: '',
    ModsDocOrigin: '',
    ModsDocTitle: '',
    checkinTime: '',
    checkinUser: '',
    docAuthor: '',
    docDate: '',
    docId: '',
    docLanguage: '',
    docName: '',
    docOrigin: '',
    docSource: '',
    docTitle: '',
    lastPageNumber: '',
    masterDocId: '',
    masterDocTitle: '',
    masterLastPageNumber: '',
    masterPageNumber: '',
    pageId: '',
    pageNumber: '',
    updateTime: '',
    updateUser: '',
    LSID: '',
    httpUri: '',
    subSubSection: ''
};

const insertXmlIntoDb = function(data) {

    data['subSubSection'] = JSON.stringify(data['subSubSection']);
    const stmt = db.prepare('INSERT INTO treatments (' + Object.keys(data).join(', ') + ') VALUES (:' + Object.keys(data).join(', :') + ')');
    stmt.run(data);
};

const getResult = async function(treatment_id) {

    const uri = tb + treatment_id;
    console.log(`getting result for ${uri}`);
    
    const { res, payload } = await Wreck.get(uri);
    const result = payload;
    
    //console.log(result);
    return result;
};

const parser = new xml2js.Parser();
const addToCache = async function(treatment_id, payload) {
    // const p = await payload;
    // console.log(p);
    parser.parseString(payload, function (err, result) {
        if (result.document.treatment) {

            data['treatment_id'] = treatment_id;
            data['LSID'] = result.document.treatment[0]['$']['LSID'];
            data['httpUri'] = result.document.treatment[0]['$']['httpUri'];
            data['subSubSection'] = result.document.treatment[0]['subSubSection'];

            for (let i in data) {
                if (i in result.document['$']) {
                    data[i] = result.document['$'][i];
                }
            }

            insertXmlIntoDb(data);
            return data;
        }
    });
}

const checkCache = function(treatment_id) {

    // check if the record exists in the SQLite database
    // if it does, serve it
    const result = db.prepare('SELECT * FROM treatments WHERE treatment_id = ?').get(treatment_id);
    return result;
};

const deleteFromCache = function(treatment_id) {
    const stmt = db.prepare('DELETE FROM treatments WHERE treatment_id = ?');
    stmt.run(treatment_id);
};

const updateCache = async function(treatment_id, result) {

    const r = await result;
    // getResult succeeded
    if (checkCache(treatment_id)) {
            
        // delete old cached value and 
        // cache the new result
        deleteFromCache(treatment_id);
        addToCache(treatment_id, r);
    }
    else {

        // no result in cache so nothing 
        // to delete
        addToCache(treatment_id, r);
    }
}

const treatment = {

    method: 'GET',
    path: "/treatment/{id}",
    handler: function(request, h) {

        const treatment_id = request.params.id;

        let result;
        if (request.query.refreshCache) {

            if (result = getResult(treatment_id)) {

                // getResult succeeded, so update the cache
                // with the new result
                updateCache(treatment_id, result);
                return result;
            }
            else {
                
                // getResult failed, so check if result 
                // exists in cache
                if (result = checkCache(treatment_id)) {

                    // return result from cache
                    return result;
                }
                else {

                    // no result in cache
                    return Utils.errorMsg;
                }
            }
        }
        else {
            if (result = checkCache(treatment_id)) {

                console.log(`checking if treatment ${treatment_id} exists`);
                // return result from cache
                return result;
            }
            else {
                console.log(`treatment ${treatment_id} doesn't exist so getting new result`)
                if (result = getResult(treatment_id)) {
                    console.log('updating cache');
                    updateCache(treatment_id, result);
                    return result;
                }
                else {
                    return Utils.errorMsg;
                }
            }
        }
    },
    config: {
        description: "fetch treatment from TreatmentBank",
        tags: ['treatment', 'api'],
        plugins: {
            'hapi-swagger': {
                order: 2,
                responseMessages: ResponseMessages
            }
        },
        validate: {
            params: Schema.treatments.params,
            query: Schema.treatments.query,
            failAction: (request, h, err) => {
                throw err;
                return;
            }
        },
        notes: [
            'This is the main route for fetching a treatment matching an id.'
        ]
    }
};

module.exports = treatment;