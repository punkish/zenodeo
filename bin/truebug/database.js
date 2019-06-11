'use strict';

const Database = require('better-sqlite3');
const config = require('config');
const dataDict = require(config.get('v2.dataDict'));
const db = new Database(config.get('data.treatments'));

module.exports = {

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

        //timer({ startTime: t0});
    },

    insertStmts: {},
    
    loadData: function(data) {

        // The data structure submitted to `loadData()` looks as follows
        // 
        // data = [ 
        //     { 
        //         treatment: { },
        //         treatmentAuthors:    [ [{}, {} … ] ],
        //         materialCitations:   [ [{}, {} … ] ],
        //         treatmentCitations:   [ [{}, {} … ] ],
        //         figureCitations:     [ [{}, {} … ] ],
        //         bibRefCitations:     [ [{}, {} … ] ] 
        //     } 
        // ]
        //
        // We need to convert this hierarchical array of treatments into 
        // a separate array for each part of the treatment so they can be 
        // inserted into the separate SQL tables. However, we also have 
        // add an extra 'treatmentId' key to all the componoents of a 
        // treatment so they can be linked together in a SQL JOIN query.
        // So the above data structure will be converted to the following
        //
        // d = {
        //     treatments: [],
        //     treatmentAuthors: [],
        //     materialsCitations: [],
        //     treatmentCitations: [],
        //     figureCitations: [],
        //     bibRefCitations: []
        // }

        for (let table in dataDict) {
 
            let d = {
                treatments: [],
                treatmentAuthors: [],
                materialsCitations: [],
                treatmentCitations: [],
                figureCitations: [],
                bibRefCitations: []
            }

            for (let i = 0, j = data.length; i < j; i++) {

                if (table === 'treatments') {
                    d.treatments.push(data[i].treatment)
                }
                else {

                    // While processing different parts of a 'treatment'
                    // such as 'treatmentCitations', 'materialsCitation'
                    // 'treatmentAuthors', 'figureCitations' and 
                    // 'bibrefCitations' we have to check whether not the
                    // array exists. For example, if no 'treatmentAuthors'
                    // were found for a specific treatment, for that 
                    // 'treatment' the 'treatmentAuthors' array will be 
                    // undefined. In that case we don't process it because 
                    // there is nothing to insert into the database.
                    if (typeof(data[i][table]) !== 'undefined') {

                        // for each component of the 'treatment', we take each 
                        // element of the array, ultimately a new row in the 
                        // database, and insert it into a separate array.
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
                if (d[t].length) {
                    insertMany(d[t]);
                }
            }
            
        }
    },

    indexTables: function() {

        // index treatents table on each queryable field
        for (let t in dataDict) {

            const table = dataDict[t];
            for (let i = 0, j = table.length; i < j; i++) {

                if (table[i].queryable) {

                    // remove 'order' because it is a pain in the ass and 
                    // remove 'fullText' because that is searched differently
                    if (table[i].plazi !== 'order' && table[i].plazi !== 'fullText') {
                        db.prepare(`CREATE INDEX IF NOT EXISTS ix_${t}_${table[i].plazi} ON ${t} (${table[i].plazi})`).run()
                    }
                }
            }
            
        }

        db.prepare('CREATE INDEX ix_treatments_kingdom_phylum ON treatments (kingdom, phylum)').run();
        db.prepare('CREATE INDEX ix_treatments_kingdom_phylum_order ON treatments (kingdom, phylum, "order")').run();
        db.prepare('CREATE INDEX ix_treatments_kingdom_phylum_order_family ON treatments (kingdom, phylum, "order", family)').run();
        db.prepare('CREATE INDEX ix_treatments_kingdom_phylum_order_family_genus ON treatments (kingdom, phylum, "order", family, genus)').run();
        db.prepare('CREATE INDEX ix_treatments_kingdom_phylum_order_family_genus_species ON treatments (kingdom, phylum, "order", family, genus, species)').run();

    },

    loadFTSTreatments: function() {
                
        db.prepare('CREATE VIRTUAL TABLE vtreatments USING FTS5(treatmentId, fullText)').run();
        db.prepare(`INSERT INTO vtreatments SELECT treatmentId, fullText FROM treatments`).run();

    }

};