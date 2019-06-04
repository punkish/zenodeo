'use strict';

const Database = require('better-sqlite3');
//const timer = require('./utils');
const Schema = require('../../api/v1/schema');

const config = require('config');
const dataDict = require(config.get('dataDict'));
const db = new Database(config.get('data.treatments'));

module.exports = {

    createTables: function() {

        const t0 = timer({ startMsg: 'creating tables… '});

        const dataTypes = {
            string: 'TEXT',
            real: 'REAL',
            date: 'DATETIME',
            year: 'DATETIME',
            latitude: 'REAL',
            longitude: 'REAL',
            uri: 'TEXT',
            'string.guid()': 'TEXT'
        }
        
        for (let table in dataDict) {

            let fieldb = dataDict[table].map(f => { 
                if (f.plazi === 'order') {
                    return '"order"';
                }
                else {
                    return f.plazi
                }
            });

            let fieldbWithTypes = dataDict[table].map(f => { 
                if (f.plazi === 'order') {
                    return '"order" TEXT';
                }
                else {
                    return f.plazi + ' ' + dataTypes[f.type] 
                }
            });

            let fieldbForBinding = dataDict[table].map(f => { 
                return `@${f.plazi}` 
            });

            // add a primary key to all the tables
            fieldbWithTypes.unshift('id INTEGER PRIMARY KEY');

            // add the treatmentId field to all tables other 
            // than 'treatments' (which already has 'treatmentId') 
            // to serve as a foreign key
            if (table !== 'treatments') {
                fieldb.unshift('treatmentId');
                fieldbWithTypes.splice(1, 0, 'treatmentId TEXT');
                fieldbForBinding.unshift('@treatmentId');
            }

            const createStmt = `CREATE TABLE IF NOT EXISTS ${table} ( ${fieldbWithTypes.join(', ')} )`;
            db.prepare(createStmt).run();

            const insertStmt = `INSERT INTO ${table} ( ${fieldb.join(', ')} ) VALUES ( ${fieldbForBinding.join(', ')} )`;
            this.insertStmts[table] = db.prepare(insertStmt);

        }

        timer({ startTime: t0});
    },

    insertStmts: {},

    rowsLoaded: {
            treatments: 0,
            treatmentAuthors: 0,
            materialCitations: 0,
            treamentCitations: 0,
            figureCitations: 0,
            bibRefCitations: 0 
    },

    // The data structure submitted to `loadData()` looks as follows
    // 
    // data = [ 
    //     { 
    //         treatment: { },
    //         treatmentAuthors: [ [Object] ],
    //         materialCitations: undefined,
    //         treamentCitations: undefined,
    //         figureCitations: undefined,
    //         bibRefCitations: [ [Object] ] 
    //     } 
    // ]
    //
    loadData: function(data) {

        for (let table in dataDict) {

            let rowCount = 0;
            let t0;

            if (table === 'treatments') {

                rowCount = data.length;
                //t0 = timer({ startMsg: `adding ${rowCount} rows to ${table} (${this.rowsLoaded[table]} already loaded)… ` });
                //this.rowsLoaded['treatments'] = +(this.rowsLoaded['treatments'] + rowCount);

            }
            else {
            
                data.forEach(el => {
                    if (el[table]) {
                        rowCount += el[table].length;
                    }
                })
                //t0 = timer({ startMsg: `   - ${rowCount} rows to ${table} (${this.rowsLoaded[table]} already loaded)… ` });
                //this.rowsLoaded[table] = +(this.rowsLoaded[table] + rowCount);
            }

            let d = {
                treatments: [],
                treatmentAuthors: [],
                materialCitations: [],
                treamentCitations: [],
                figureCitations: [],
                bibRefCitations: []
            }

            for (let i = 0, j = data.length; i < j; i++) {

                if (table === 'treatments') {
                    d[table].push(data[i].treatment)
                }
                else {

                    if (typeof data[i][table] !== 'undefined') {

                        for (let r in data[i][table]) {
                            d[table].push(data[i][table][r])
                        }
                        
                    }
                    
                }
            }

            const insertMany = db.transaction((rows) => {
                for (const row of rows) {
                    
                    this.insertStmts[table].run(row);
                }
            });

            for (let t in d) {
                
                insertMany(d[t]);
            }
            
            //timer({ startTime: t0 });
        }
    },

    indexTables: function() {

        // index all tables on treatmentId
        // for (let table in dataDict) {

        //     const t0 = timer({ startMsg: `indexing ${table} table… `});

        //     db.prepare(`CREATE INDEX ix_${table}_treatments ON ${table} (treatmentId)`).run();

        //     timer({ startTime: t0 });
        // }

        // index treatents table on each queryable field
        for (let table in dataDict) {
            const queryAble = Object.keys(Schema[table].query);
            // remove 'order' because it is a pain in the ass
            queryAble.splice(queryAble.indexOf('order'), 1);
            // remove 'q' because no such column
            queryAble.splice(queryAble.indexOf('q'), 1);

            for (let k in queryAble) {

                    const t0 = timer({ startMsg: `indexing ${table} table on ${queryAble[k]}… `});
                    db.prepare(`CREATE INDEX IF NOT EXISTS ix_${table}_${queryAble[k]} ON ${table} (${queryAble[k]})`).run()
                    timer({ startTime: t0 });
                
            }
        }

    },

    loadFTSTreatments: function() {
        
        const t0 = timer({ startMsg: 'loading treatments FTS table… ' });
        
        db.prepare('CREATE VIRTUAL TABLE vtreatments USING FTS5(treatmentId, fullText)').run();
        db.prepare(`INSERT INTO vtreatments SELECT treatmentId, fullText FROM treatments`).run();

        timer({ startTime: t0 });
    },

    countRows: function() {

        console.log('\nTotal rows inserted\n' + '-'.repeat(30))
        for (let table in dataDict) {
            const rows = db.prepare(`SELECT Count(*) AS c FROM ${table}`).get();
            console.log(`${table}: ${rows.c}`);
        }
    }
};