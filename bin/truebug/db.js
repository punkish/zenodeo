'use strict';

const Debug = require('debug')('db');
const Config = require('../../config');
const dataDict = require('./data-dictionary');
const Database = require('better-sqlite3');
const ds = new Database(`${Config.data}/plazi2.sqlite`);
const { performance } = require('perf_hooks');

const db = {

    createTables: function() {

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

            let fields = dataDict[table].map(f => { 
                if (f.plazi === 'order') {
                    return '"order"';
                }
                else {
                    return f.plazi
                }
            });

            let fieldsWithTypes = dataDict[table].map(f => { 
                if (f.plazi === 'order') {
                    return '"order" TEXT';
                }
                else {
                    return f.plazi + ' ' + dataTypes[f.type] 
                }
            });

            let fieldsForBinding = dataDict[table].map(f => { 
                return `@${f.plazi}` 
            });

            // add a primary key to all the tables
            fieldsWithTypes.unshift('id INTEGER PRIMARY KEY');

            // add the treatmentId field to all tables other 
            // than 'treatments' (which already has 'treatmentId') 
            // to serve as a foreign key
            if (table !== 'treatments') {
                fields.unshift('treatmentId');
                fieldsWithTypes.unshift('treatmentId TEXT');
                fieldsForBinding.unshift('@treatmentId');
            }

            const createStmt = `CREATE TABLE IF NOT EXISTS ${table} ( ${fieldsWithTypes.join(', ')} )`;
            //Debug(createStmt)
            ds.prepare(createStmt).run();

            const insertStmt = `INSERT INTO ${table} ( ${fields.join(', ')} ) VALUES ( ${fieldsForBinding.join(', ')} )`;
            Debug(insertStmt);
            this.insertStmts[table] = ds.prepare(insertStmt);
        }
    },

    /*
    createTables_orig: function() {
        // Debug('creating tables');
        // const t0 = performance.now();

        ds.prepare('CREATE TABLE IF NOT EXISTS treatments (id INTEGER PRIMARY KEY, treatment_id TEXT, document_attr JSON, taxonomicname_attr JSON, treatment_text TEXT)').run();

        ds.prepare('CREATE VIRTUAL TABLE vtreatments USING FTS5(treatment_id, treatment_text)').run();

        // ds.prepare('CREATE TABLE IF NOT EXISTS materialcitations (id INTEGER PRIMARY KEY, treatment_id TEXT REFERENCES treatments(treatment_id), location TEXT, latitude REAL, longitude REAL, materialcitation_attr JSON)').run();
        ds.prepare('CREATE TABLE IF NOT EXISTS materialcitations (id INTEGER PRIMARY KEY, treatment_id TEXT, location TEXT, latitude REAL, longitude REAL, materialcitation_attr JSON)').run();

        // ds.prepare('CREATE TABLE IF NOT EXISTS treatmentcitations (id INTEGER PRIMARY KEY, treatment_id TEXT REFERENCES treatments(treatment_id), treatmentcitation_attr JSON)').run();
        ds.prepare('CREATE TABLE IF NOT EXISTS treatmentcitations (id INTEGER PRIMARY KEY, treatment_id TEXT, treatmentcitation_attr JSON)').run();

        // const t1 = performance.now();
        // Debug('creating tables took ' + (t1 - t0) + ' ms')
    },
    */

    insertStmts: {},

    loadData: function(rows, treatmentId) {

        for (let table in dataDict) {
            Debug(`loading ${table}`);
            const t0 = performance.now();

            const insertMany = ds.transaction((rows) => {
                for (const row of rows) {
                    // if (table !== 'treatments') {
                    //     row[table].treatmentId = 
                    // }
                    this.insertStmts[table].run(row[table]);
                }
            });

            insertMany(rows);

            const t1 = performance.now();
            Debug(`loading ${table} took ${(t1 - t0)} ms`)
        }
    },

    indexTreatments: function() {
        Debug('indexing treatments table');
        const t0 = performance.now();

        Debug('creating index on treatments table');
        ds.prepare('CREATE INDEX ix_treatements ON treatments (treatmentId)').run();

        const t1 = performance.now();
        Debug('indexing treatments table took ' + (t1 - t0) + ' ms')
    },

    loadFTSTreatments: function() {
        Debug('loading treatments FTS table');
        const t0 = performance.now();

        ds.prepare(`INSERT INTO vtreatments SELECT treatmentId, treatmentText FROM treatments`).run();

        const t1 = performance.now();
        Debug('loading treatments FTS table took ' + (t1 - t0) + ' ms')
    },

    /*
    loadMaterialCitations: function(rows) {
        // Debug('loading materialcitations table');
        // const t0 = performance.now();

        const insert = ds.prepare('INSERT INTO materialcitations (treatment_id, location, latitude, longitude, materialcitation_attr) VALUES (@treatment_id, @location, @latitude, @longitude, @materialcitation_attr)');

        const insertMany = ds.transaction((rows) => {
            for (const row of rows) insert.run(row);
        });

        insertMany(rows);

        // const t1 = performance.now();
        // Debug('loading materialcitations table took ' + (t1 - t0) + ' ms')
    },

    loadTreatmentCitations: function(rows) {
        // Debug('loading treatmentcitations table');
        // const t0 = performance.now();

        const insert = ds.prepare('INSERT INTO treatmentcitations (treatment_id, treatmentcitation_attr) VALUES (@treatment_id, @treatmentcitation_attr)');

        const insertMany = ds.transaction((rows) => {
            for (const row of rows) insert.run(row);
        });

        insertMany(rows);

        // const t1 = performance.now();
        // Debug('loading treatmentcitations table took ' + (t1 - t0) + ' ms')
    }
    */
};

module.exports = db;