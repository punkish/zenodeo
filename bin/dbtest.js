const config = require('config');
const Database = require('better-sqlite3');
const db = new Database(config.get('data.treatments'));
const debug = require('debug')('dbtest');


const queryDb = function(queries) {
    const timing = {};

    let totalTime = 0;

    for (let q in queries) {
        try {
            const start = new Date();
            const res = db.prepare(queries[q]).get();
            const end = new Date();
            const t = end - start;
            totalTime = totalTime + t;
            timing[q] = t + 'ms';
        } 
        catch (error) {
            console.log(error);
        }
    }

    const longest = Math.max(...Object.keys(timing).map(t => t.length)) + 1;

    for (let t in timing) {
        let pt = '';
        if (t.length <= longest) {
            pt = t + ' '.repeat(longest - t.length);
        }
        console.log(`${pt}: ${timing[t]}`);
    }

    console.log('='.repeat(longest + 10));
    console.log('total' + ' '.repeat(longest - 'total'.length) + ': ' + totalTime + 'ms');
};

const q2 = {
    'Count treatmentId' : 'SELECT Count(treatmentId)            FROM treatments WHERE deleted = 0',
    'Count journalTitle': 'SELECT Count(DISTINCT journalTitle)  FROM treatments WHERE deleted = 0',
    'Count journalYear' : 'SELECT Count(DISTINCT journalYear)   FROM treatments WHERE deleted = 0',
    'Count kingdom'     : 'SELECT Count(DISTINCT kingdom)       FROM treatments WHERE deleted = 0',
    'Count phylum'      : 'SELECT Count(DISTINCT phylum)        FROM treatments WHERE deleted = 0',
    'Count "order"'     : 'SELECT Count(DISTINCT "order")       FROM treatments WHERE deleted = 0',
    'Count family'      : 'SELECT Count(DISTINCT family)        FROM treatments WHERE deleted = 0',
    'Count genus'       : 'SELECT Count(DISTINCT genus)         FROM treatments WHERE deleted = 0',
    'Count species'     : 'SELECT Count(DISTINCT species)       FROM treatments WHERE deleted = 0',
    'Count status'      : 'SELECT Count(DISTINCT status)        FROM treatments WHERE deleted = 0',
    'Count rank'        : 'SELECT Count(DISTINCT rank)          FROM treatments WHERE deleted = 0',
    'treatments'        : 'SELECT *                             FROM treatments WHERE deleted = 0 LIMIT 30 OFFSET 1',
    //'SELECT id, treatmentId, treatmentTitle, doi AS articleDoi, zenodoDep, zoobank, articleTitle, publicationDate, journalTitle, journalYear, journalVolume, journalIssue, pages, authorityName, authorityYear, kingdom, phylum, "order", family, genus, species, status, taxonomicNameLabel, rank FROM treatments WHERE deleted = 0 LIMIT @limit OFFSET @offset',
    treatments: 'SELECT Count(treatmentId) FROM treatments WHERE deleted = 0',
                
    specimens: `SELECT  Sum(specimenCount)  
                FROM    materialsCitations m JOIN treatments t ON m.treatmentId = t.treatmentId 
                WHERE   m.deleted = 0 AND specimenCount != ""`,

    'male specimens': `SELECT  Sum(specimenCountMale) 
                    FROM    materialsCitations m JOIN treatments t ON m.treatmentId = t.treatmentId 
                    WHERE   m.deleted = 0 AND specimenCountMale != ""`,

    'female specimens': `SELECT Sum(specimenCountFemale) 
                    FROM   materialsCitations m JOIN treatments t ON m.treatmentId = t.treatmentId 
                    WHERE  m.deleted = 0 AND specimenCountFemale != ""`,

    'treatments with specimens': `SELECT Count(DISTINCT t.treatmentId) 
                    FROM   materialsCitations m JOIN treatments t ON m.treatmentId = t.treatmentId  
                    WHERE  m.deleted = 0 AND specimenCount != ""`,

    'treatments with male specimens': `SELECT Count(DISTINCT t.treatmentId) 
                    FROM   materialsCitations m JOIN treatments t ON m.treatmentId = t.treatmentId 
                    WHERE  m.deleted = 0 AND specimenCountMale != ""`,

    'treatments with female specimens': `SELECT Count(DISTINCT t.treatmentId)  
                    FROM   materialsCitations m JOIN treatments t ON m.treatmentId = t.treatmentId 
                    WHERE  m.deleted = 0 AND specimenCountFemale != ""`,

    'figure citations': 'SELECT Count(figureCitationId) FROM figureCitations f JOIN treatments t ON f.treatmentId = t.treatmentId WHERE f.deleted = 0 AND t.deleted = 0'
};


queryDb(q2);
