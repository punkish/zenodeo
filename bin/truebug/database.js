'use strict';

const Database = require('better-sqlite3');
const config = require('config');
const dataDict = require(config.get('v2.dataDict'));
const db = new Database(config.get('data.treatments'));
const debug = false;

const deBugger = function(options) {
    
    const type = options.type;
    const stmt = options.stmt;
    const table = options.table;
    const values = options.values;

    //console.log(options)

    if (options.debug) {
        if (type === 'insert') {
            if (values.length) {
                let istmt = database.insertStmts[table];
                values.forEach(v => {istmt = istmt.replace(/\?/, `'${v}'`)});
                console.log(istmt);
            }
        }
        else {
            console.log(options.stmt);
        }
    }
    else {
        if (type === 'createInsert') {
            database.insertStmts[table] = db.prepare(stmt);
        }
        else if (type === 'insert') {
            database.insertStmts[table].run(values);
        }
        else if (type === 'create') {
            db.prepare(stmt).run();
        }
        else if (type === 'index') {
            db.prepare(stmt).run();
        }
    }
};

const database = {

    createTables: function() {
        
        for (let table in dataDict) {

            let cols = [];
            let colsWithTypes = [];
            let colsForBinding = [];

            dataDict[table].forEach(f => {
                cols.push( f.plazi );
                colsWithTypes.push( f.plazi + ' ' + f.type );
                colsForBinding.push( '?' );
            });

            // add a primary key to all the tables
            colsWithTypes.unshift('id INTEGER PRIMARY KEY');

            // for making the UNIQUE indexes
            let colUniq = [];

            // add colum for 'deleted' flag at the end of the table def
            // const col = 'deleted';
            // cols.push(col);
            // colsWithTypes.push(`${col} TEXT DEFAULT 'false'`);
            // colsForBinding.push( '?' );

            // for making the INSERT statements
            let colNotUniq = [];

            // find the col with the UNIQUE constraint in it and remove 
            // the constraint. Then add the UNIQUE constraint on that 
            // column combined with treatmentId
            for (let i = 0, j = colsWithTypes.length; i < j; i++) {
                const c = colsWithTypes[i];
                const colName = c.split(/ /)[0];

                if (c.indexOf('UNIQUE') > -1) {
                    colUniq.push(colName);

                    // remove the UNIQUE keyword from all UNIQUE
                    // cols except treatments.treatmentId because 
                    // we will add a separate clause for these 
                    // columns at the end of the table
                    if (table !== 'treatments') {
                        colsWithTypes[i] = c.replace(' UNIQUE', '');
                    }
                }
                else {
                    if (colName !== 'id') {
                        colNotUniq.push(colName)
                    }
                }
            }
            
            if (table !== 'treatments') {
                colsWithTypes.push(`UNIQUE (${colUniq.join(', ')})`);
            }

            // the following are to increase legibility of the statements
            let s0 = ' ';
            let s1 = ' ';
            let s2 = ', ';

            if (debug) {
                s0 = '\n';
                s1 = `${s0}\t`;
                s2 = `,${s1}`;
            }
            
            const createStmt = `CREATE TABLE IF NOT EXISTS ${table} (${s1}${colsWithTypes.join(s2)}${s0})`;
            deBugger({debug: debug, type: 'create', stmt: createStmt, table: table, values: []});

            const colNotUniqStr = colNotUniq.map(c => { return c + '=excluded.' + c; });

            const insertStmt = `INSERT INTO ${table} (${s1}${cols.join(s2)} ${s0})${s0}VALUES (${s1}${colsForBinding.join(s2)} ${s0})${s0}ON CONFLICT (${colUniq.join(', ')})${s0}DO UPDATE SET${s1}${colNotUniqStr.join(s2)}`;
            deBugger({debug: debug, type: 'createInsert', stmt: insertStmt, table: table, values: []});
        }

        // create virtual FTS table
        const createStmt = 'CREATE VIRTUAL TABLE IF NOT EXISTS vtreatments USING FTS5(treatmentId, fullText)';
        deBugger({debug: debug, type: 'create', stmt: createStmt, table: 'vtreatments', values: []});

        const insertStmt = 'INSERT INTO vtreatments SELECT treatmentId, fullText FROM treatments WHERE deleted = 0';
        deBugger({debug: debug, type: 'createInsert', stmt: insertStmt, table: 'vtreatments', values: []});

        const createVtableFigCit = 'CREATE VIRTUAL TABLE IF NOT EXISTS vfigurecitations USING FTS5(figureCitationId, captionText)';
        deBugger({debug: debug, type: 'create', stmt: createVtableFigCit, table: 'vfigurecitations', values: []});

        const insertVtableFigCit = 'INSERT INTO vfigurecitations SELECT figureCitationId, captionText FROM figureCitations WHERE deleted = 0';
        deBugger({debug: debug, type: 'createInsert', stmt: insertVtableFigCit, table: 'vfigurecitations', values: []});

        const createVtableBibRefCit = 'CREATE VIRTUAL TABLE IF NOT EXISTS vbibrefcitations USING FTS5(bibRefCitationId, refString)';
        deBugger({debug: debug, type: 'create', stmt: createVtableBibRefCit, table: 'vbibrefcitations', values: []});

        const insertVtableBibRefCit = 'INSERT INTO vbibrefcitations SELECT bibRefCitationId, refString FROM bibRefCitations WHERE deleted = 0';
        deBugger({debug: debug, type: 'createInsert', stmt: insertVtableBibRefCit, table: 'vbibrefcitations', values: []});
    },

    // store the insert statements for later use
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
                    const r = Object.values(row);
                    deBugger({debug: debug, type: 'insert', stmt: '', table: table, values: r});
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

        // additional indexes on taxon classifications to calc taxon stats
        const taxonIndexes = [
            ['kingdom', 'phylum'],
            ['kingdom', 'phylum', '"order"'],
            ['kingdom', 'phylum', '"order"', 'family'],
            ['kingdom', 'phylum', '"order"', 'family', 'genus'],
            ['kingdom', 'phylum', '"order"', 'family', 'genus', 'species']
        ];

        // const tables = Object.keys(dataDict);

        // const bar = new progress('processing [:bar] :rate tables/sec :current/:total done (:percent) time left: :etas', {
        //     complete: '=',
        //     incomplete: ' ',
        //     width: 30,
        //     total: tables.length + taxonIndexes.length
        // });

        // index treatents table on each queryable field
        for (let t in dataDict) {

            const table = dataDict[t];
            let i = 0, j = table.length;
            for (; i < j; i++) {
                const col = table[i];
                let colname = col.plazi;
                let colName = colname.replace(/"/g, '');

                if (col.queryable) {
                    //bar.tick(1);

                    const indexStmt = `CREATE INDEX IF NOT EXISTS ix_${t}_${colName} ON ${t} (${colname}) WHERE deleted = 0`;
                    deBugger({debug: debug, type: 'index', stmt: indexStmt, table: t, values: []});
                }
            }
            
        }

        taxonIndexes.forEach(cols => {
            const i = cols.indexOf('"order"');
            let name = cols.join('_').replace(/"/g, '');
            const ixStmt = `CREATE INDEX IF NOT EXISTS ix_treatments_${name} ON treatments (${cols.join(', ')}) WHERE deleted = 0`;
            deBugger({debug: debug, type: 'index', stmt: ixStmt, table: 'treatments', values: []});
        });

        let facets = config.get('v2.facets');
        facets.unshift('treatmentId');
        //CREATE INDEX IF NOT EXISTS ix_treatments_facets ON treatments (deleted, treatmentId, journalTitle, journalYear, kingdom, phylum, "order", family, genus, species, status, rank) WHERE deleted = 0
        const ixStmt = `CREATE INDEX IF NOT EXISTS ix_treatments_facets ON treatments (deleted, ${facets.join(', ')}) WHERE deleted = 0`;
        deBugger({debug: debug, type: 'index', stmt: ixStmt, table: 'treatments', values: []});
    },

    loadFTSTreatments: function() {
        deBugger({debug: debug, type: 'insert', stmt: '', table: 'vtreatments', values: []})
    },

    loadFTSFigureCitations: function() {
        deBugger({debug: debug, type: 'insert', stmt: '', table: 'vfigurecitations', values: []})
    },

    loadFTSBibRefCitations: function() {
        deBugger({debug: debug, type: 'insert', stmt: '', table: 'vbibrefcitations', values: []})
    }

};

module.exports = database;