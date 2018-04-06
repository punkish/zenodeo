const Joi = require('joi');
const Wreck = require('wreck');
const Config = require('../../../config.js');
const ResponseMessages = require('../../response-messages');
const Utils = require('../utils.js');
const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');
const Database = require('better-sqlite3');

// better messages
const Boom = require('boom');

const db = new Database('data/tb.sqlite');
const tb = 'http://tb.plazi.org/GgServer/xml/';

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

let stmt = db.prepare('INSERT INTO treatments (' + Object.keys(data).join(', ') + ') VALUES (:' + Object.keys(data).join(', :') + ')');

const insertXmlIntoDb = function(data) {
    /*
    const stmt = db.prepare(`
        INSERT INTO treatments (
            treatment_id, 
            ID_DOI,
            ID_Pensoft_Pub,
            ModsDocAuthor,
            ModsDocDate,
            ModsDocID,
            ModsDocOrigin,
            ModsDocTitle,
            checkinTime,
            checkinUser,
            docAuthor,
            docDate,
            docId,
            docLanguage,
            docName,
            docOrigin,
            docSource,
            docTitle,
            lastPageNumber,
            masterDocId,
            masterDocTitle,
            masterLastPageNumber,
            masterPageNumber,
            pageId,
            pageNumber,
            updateTime,
            updateUser,
            LSID,
            httpUri,
            subSubSection
        )
        VALUES (
            :treatment_id, 
            :ID_DOI,
            :ID_Pensoft_Pub,
            :ModsDocAuthor,
            :ModsDocDate,
            :ModsDocID,
            :ModsDocOrigin,
            :ModsDocTitle,
            :checkinTime,
            :checkinUser,
            :docAuthor,
            :docDate,
            :docId,
            :docLanguage,
            :docName,
            :docOrigin,
            :docSource,
            :docTitle,
            :lastPageNumber,
            :masterDocId,
            :masterDocTitle,
            :masterLastPageNumber,
            :masterPageNumber,
            :pageId,
            :pageNumber,
            :updateTime,
            :updateUser,
            :LSID,
            :httpUri,
            :subSubSection
        )
    `);
    */

    data['subSubSection'] = JSON.stringify(data['subSubSection']);
    stmt.run(data);
};

const treatment = {

    method: 'GET',

    path: "/treatment/{id}",

    config: {
        description: "treatment",
        tags: ['treatment', 'api'],
        plugins: {
            'hapi-swagger': {
                order: 2,
                responseMessages: ResponseMessages
            }
        },
        validate: {
            params: {
                id: Joi.string().required()
            }
        },
        notes: [
            'This is the main route for fetching a treatment matching an id.'
        ]
    },
    
    handler: function(request, reply) {

        const treatment_id = request.params.id;
        const file = path.join('data/plazi.xml', treatment_id + '.xml');

        // check if the record exists in the SQLite database
        // if it does, serve it
        const result = db.prepare('SELECT * FROM treatments WHERE treatment_id = ?').get(treatment_id);

        if (result) {
            reply(result);
        }
        else {
            
            Wreck.get(tb + treatment_id, (err, res, payload) => {
                if (err) {
                    reply(Boom.notFound('Cannot find the requested treatment'));

                    return;
                }

                const parser = new xml2js.Parser();
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
                        reply(data);
                    }
                });
                    
            });
        }
        
    }
};

module.exports = treatment;