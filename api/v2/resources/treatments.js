const Schema = require('../schema.js');
const ResponseMessages = require('../../responseMessages');
const Database = require('better-sqlite3');

const config = require('config');
const sqliteDatabase = config.get('data.sqliteDatabase');
const db = new Database(sqliteDatabase);

module.exports = {
    plugin: {
        name: 'treatments2',
        register: function(server, options) {

            server.route([
                { 
                    path: '/treatments', 
                    method: 'GET', 
                    config: {
                        description: "Retrieve treatments",
                        tags: ['treatments', 'api'],
                        plugins: {
                            'hapi-swagger': {
                                order: 3,
                                responseMessages: ResponseMessages
                            }
                        },
                        validate: Schema.treatments,
                        notes: [
                            'A taxonomic treatment.',
                        ]
                    },
                    handler 
                }
            ]);
        },
    },
};


const queryMaker = function(request) {

    const queryParams = Object.keys(Schema.treatments.query);
    let query = [];
    let params = [];

    let selectTreatments = '';

    // remove 'treatmentId' from the queryParams because that would be 
    // a query for a specific treatment, and for that, a static XML
    // file is returned
    queryParams.splice(queryParams.indexOf('treatmentId'), 1);

    // 'q' is treated special as a fulltext search is performed
    if (request.query.q) {

        selectTreatments = `SELECT treatmentId, 
                                snippet(vtreatments, 1, '<b>', '</b>', '', 25) s 
                            FROM vtreatments 
                            WHERE vtreatments MATCH ?`;

        // queryParams.splice(queryParams.indexOf('q'), 1);
        // for (let i = 0, j = queryParams.length; i < j; i++) {
        // }

        return db.prepare(selectTreatments).all(request.query.q)
    }
    else {

        // remove 'q' from queryParams because we've already dealth 
        // with it above
        queryParams.splice(queryParams.indexOf('q'), 1);

        for (let i = 0, j = queryParams.length; i < j; i++) {
            if (request.query[queryParams[i]]) {
                query.push(queryParams[i] + ' = ?');
                params.push(request.query[queryParams[i]])
            }
        }

        selectTreatments = 'SELECT treatmentId, treatmentTitle FROM treatments WHERE ' + query.join(' AND ');
        console.log(selectTreatments)
        return db.prepare(selectTreatments).all(params)
    }
}

// const selectByLoc = db.prepare('SELECT treatment_id, location, latitude, longitude FROM `materialcitations` WHERE latitude != 0 AND longitude != 0');
//const selectTreatment = db.prepare('SELECT * FROM treatments WHERE treatmentId = @treatmentId');

const handler = function(request, h) {
    
    let result;

    // ignore all other query params if treatmentId is present
    if (request.query.treatmentId) {
        
        result = selectTreatment.get(request.query.treatmentId);
    }
    else {
        result = queryMaker(request);
    }

    return result;
    
};