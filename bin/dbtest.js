const config = require('config');
const Database = require('better-sqlite3');
const db = new Database(config.get('data.treatments'));
const debug = require('debug')('dbtest');

let total = 0;
const queryDb = function(q) {
    try {
        const start = new Date();
        const res = db.prepare(q).get().c;
        const end = new Date();
        const t = end - start;
        total = total + t;
        console.log(`${res} (${t}ms)`);
    } 
    catch (error) {
        console.log(error);
    }
};

const q1 = [
    'SELECT Count(treatmentId)            AS c FROM activeTreatments',
    'SELECT Count(DISTINCT journalTitle)  AS c FROM activeTreatments',
    'SELECT Count(DISTINCT journalYear)   AS c FROM activeTreatments',
    'SELECT Count(DISTINCT kingdom)       AS c FROM activeTreatments',
    'SELECT Count(DISTINCT phylum)        AS c FROM activeTreatments',
    'SELECT Count(DISTINCT "order")       AS c FROM activeTreatments',
    'SELECT Count(DISTINCT family)        AS c FROM activeTreatments',
    'SELECT Count(DISTINCT genus)         AS c FROM activeTreatments',
    'SELECT Count(DISTINCT species)       AS c FROM activeTreatments',
    'SELECT Count(DISTINCT status)        AS c FROM activeTreatments',
    'SELECT Count(DISTINCT rank)          AS c FROM activeTreatments'
];

const q2 = [
    'SELECT Count(treatmentId)            AS c FROM treatments WHERE deleted = 0',
    'SELECT Count(DISTINCT journalTitle)  AS c FROM treatments WHERE deleted = 0',
    'SELECT Count(DISTINCT journalYear)   AS c FROM treatments WHERE deleted = 0',
    'SELECT Count(DISTINCT kingdom)       AS c FROM treatments WHERE deleted = 0',
    'SELECT Count(DISTINCT phylum)        AS c FROM treatments WHERE deleted = 0',
    'SELECT Count(DISTINCT "order")       AS c FROM treatments WHERE deleted = 0',
    'SELECT Count(DISTINCT family)        AS c FROM treatments WHERE deleted = 0',
    'SELECT Count(DISTINCT genus)         AS c FROM treatments WHERE deleted = 0',
    'SELECT Count(DISTINCT species)       AS c FROM treatments WHERE deleted = 0',
    'SELECT Count(DISTINCT status)        AS c FROM treatments WHERE deleted = 0',
    'SELECT Count(DISTINCT rank)          AS c FROM treatments WHERE deleted = 0'
];

async function testAsync() {
    

    // `promises` is an array of promises, because `bcrypt.hash()` returns a
    // promise if no callback is supplied.
    const promises = queries.map(q => queryDb(q));
    console.log(await Promise.all(promises));
}

function testSync() {

    // `promises` is an array of promises, because `bcrypt.hash()` returns a
    // promise if no callback is supplied.
    q2.map(q => queryDb(q));
    console.log(`all took ${total}ms`);
}

//testAsync();
testSync();