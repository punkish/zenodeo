'use strict';

const Database = require('better-sqlite3');
const config = require('config');
const db = new Database(config.get('data.treatments'));

const selectStatsAll = [
    'SELECT Count(*) AS treatments FROM treatments',
    'SELECT Sum(specimenCount) AS specimens FROM materialsCitations',
    'SELECT Sum(specimenCountMale) AS "male specimens" FROM materialsCitations',
    'SELECT Sum(specimenCountFemale) AS "female specimens" FROM materialsCitations',
    'SELECT Count(DISTINCT treatmentId) AS "treatments with specimens" FROM materialsCitations WHERE specimenCount != ""',
    'SELECT Count(DISTINCT treatmentId) AS "treatments with male specimens" FROM materialsCitations WHERE specimenCountMale != ""',
    'SELECT Count(DISTINCT treatmentId) AS "treatments with female specimens" FROM materialsCitations WHERE specimenCountFemale != ""'
];

const stats = function(query) {
    
    countQueries.forEach(q => {

        let select = q.select;
        let from =  q.from;
        let where = q.where;

        if (query) {
            from  = query.from ? query.from : '';
            where = query.where ? query.where : '';
        }
        
        const stmt = `SELECT ${select} FROM ${from} WHERE ${where}`;
        console.log(stmt);
    })
}



const queries = [
    {
        select: 'id, treatments.treatmentId, treatmentTitle, snippet(vtreatments, 1, "<b>", "</b>", "", 50) AS s',
        from: 'treatments JOIN vtreatments ON treatments.treatmentId = vtreatments.treatmentId',
        where: 'vtreatments MATCH ?'
    },
    {
        select: 'id, treatments.treatmentId, treatmentTitle, authorityName || ". " || authorityYear || ". <i>" || articleTitle || ".</i> " || journalTitle || ", " || journalYear || ", pp. " || pages || ", vol. " || journalVolume || ", issue " || journalIssue AS s',
        from: 'treatments JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId',
        where: 'latitude = ? AND longitude = ?'
    },
    {
        select: 'id, treatments.treatmentId, treatmentTitle, authorityName || ". " || authorityYear || ". <i>" || articleTitle || ".</i> " || journalTitle || ", " || journalYear || ", pp. " || pages || ", vol. " || journalVolume || ", issue " || journalIssue AS s',
        from: 'treatments',
        where: 'kingdom = ? AND phylum = ?'
    }
];

stats();