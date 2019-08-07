'use strict';

const Database = require('better-sqlite3');
const config = require('config');
const db = new Database(config.get('data.treatments'));

const start = new Date().getTime();

const data = [
    {table: 'authors', source: require(config.get('data.authors')), col: 'author'},
    {table: 'families', source: require(config.get('data.families')), col: 'family'},
    {table: 'keywords', source: require(config.get('data.keywords')), col: 'keyword'},
    {table: 'taxa', source: require(config.get('data.taxa')), col: 'taxon'}
];

// data.forEach(d => {
//     console.log(`creating table ${d.table}`);
//     db.prepare(`CREATE TABLE IF NOT EXISTS ${d.table} (id INTEGER PRIMARY KEY, ${d.col} TEXT)`).run()
// });

// data.forEach(d => {
//     console.log(`inserting data into table ${d.table}`);
//     const s = db.prepare(`INSERT INTO ${d.table} (${d.col}) VALUES (?)`);
//     const source = d.source;
//     source.forEach(v => s.run(v));
// });

// data.forEach(d => {
//     console.log(`creating index on table ${d.table}`);
//     db.prepare(`CREATE INDEX IF NOT EXISTS ix_${d.table}_${d.col} ON ${d.table} (${d.col})`).run()
// });

// const sel = db.prepare(`SELECT family FROM families WHERE family LIKE ?`);
// sel.raw();
// const res = sel.all('%tin%').map(r => r[0]);
// console.log(res);

const q = "Trematoda (awaiting allocation)";
const sel = `SELECT Count(id) AS c FROM treatments t JOIN vtreatments v ON t.treatmentId = v.treatmentId WHERE vtreatments MATCH '${q}'`;
const res = db.prepare(sel).get();
console.log(res);

const end = new Date().getTime();
console.log(`this took ${end - start} ms`);

