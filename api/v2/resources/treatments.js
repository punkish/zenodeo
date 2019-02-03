const Schema = require('../schema.js');
const Config = require('../../../config.js');
const ResponseMessages = require('../../response-messages');
const Utils = require('../utils.js');
const Database = require('better-sqlite3');
const db = new Database('data/plazi.sqlite');
const Debug = require('debug')('v2: treatments');

const t = `'${Config.zenodeo}/v2/treatment/'`;
//const selectStmt = db.prepare(`SELECT ${t} || t.treatment_id AS t, v.docTitle FROM vtreatments v JOIN treatments t ON v.rowid = t.rowid WHERE vtreatments MATCH ?`);
const selectStmt = db.prepare(`SELECT treatment_id, ${t} || treatment_id || ".xml" AS uri, snippet(vtreatments, 1, '<b>', '</b>', '', 25) s FROM vtreatments WHERE vtreatments MATCH ?`);

const treatments = {
    method: 'GET',
    path: "treatments/",
    handler: function(request, h) {

        const q = request.query.q;
        const uri = `${Config.zenodeo}/v2/treatments?q=${q}`;
        
        const rows = selectStmt.all(q);
        return Utils.packageResult(uri, rows);
    },
    config: {
        description: "fetch treatments from TreatmentBank",
        tags: ['treatments', 'api'],
        plugins: {
            'hapi-swagger': {
                order: 7,
                responseMessages: ResponseMessages
            }
        },
        validate: Schema.treatments,
        notes: [
            'This is the main route for fetching treatments via a fulltext search.'
        ]
    }
};

module.exports = treatments;