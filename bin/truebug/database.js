'use strict';

const Database = require('better-sqlite3');
const config = require('config');
const dataDict = require(config.get('v2.dataDict'));
const dataDictionary = dataDict.dataDictionary;
const db = new Database(config.get('data.treatmentsTmp'));
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
                let istmt = database.insertStatic[table];
                //values.forEach(v => {istmt = istmt.replace(/\?/, `'${v}'`)});
                //console.log(values)
                //console.log('done')
                //console.log(istmt);
            }
        }
        else {
            console.log(options.stmt);
        }
    }
    else {
        if (type === 'createInsertStatements') {
            console.log(`- creating insert statement ${table}`);
            database.insertStmts[table] = db.prepare(stmt);
        }
        else if (type === 'insert') {
            //database.insertStmts[table].run(values);
            // console.log(table)
            // console.log('----------------------------------')
            // console.log(values)
            // console.log('==================================\n')
            //console.log(database.insertStatic[table])
            database.insertStmts[table].run(values);
        }
        else if (type === 'create') {
            console.log(`- creating table ${table}`);
            db.prepare(stmt).run();
        }
        else if (type === 'index') {
            try {
                console.log(`- creating index ${table}`);
                db.prepare(stmt).run();
            }
            catch(error) {
                console.log(`… skipping index ${table} (already exists)`);
            }

            
        }
    }
};

const database = {

    createTables: function() {
        
        for (let table in dataDictionary) {

            let cols = [];
            let colsWithTypes = [];
            let colsForBinding = [];

            dataDictionary[table].forEach(f => {

                if (f.sqlType) {

                    if ( f.plaziName === 'q') {
                        cols.push( 'fulltext' );
                    }
                    else if ( f.plaziName === 'order' ) {
                        cols.push( '"order"' );
                    }
                    else {
                        cols.push( f.plaziName );
                    }

                    colsWithTypes.push( f.plaziName + ' ' + f.sqlType );
                    colsForBinding.push( '?' );
                }

            });

            cols.push( 'inserted' );
            colsWithTypes.push( "inserted INTEGER DEFAULT (strftime('%s','now'))" );
            colsForBinding.push( '?' );

            // add a primary key to all the tables
            // not needed with the new datadictionary
            //colsWithTypes.unshift('id INTEGER PRIMARY KEY');

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

        const createViewActiveTreatments = 'CREATE VIEW IF NOT EXISTS activeTreatments AS SELECT id, treatmentId, treatmentTitle, doi AS articleDoi, zenodoDep, zoobank, articleTitle, publicationDate, journalTitle, journalYear, journalVolume, journalIssue, pages, authorityName, authorityYear, kingdom, phylum, "order", family, genus, species, status, taxonomicNameLabel, rank FROM treatments WHERE deleted = 0';

        deBugger({debug: debug, type: 'create', stmt: createViewActiveTreatments, table: 'activeTreatments', values: []});
    },

    createTablesStatic: function() {
        
        const tables = {
            treatments: `CREATE TABLE IF NOT EXISTS treatments ( 
    id INTEGER PRIMARY KEY, 
    treatmentId TEXT NOT NULL UNIQUE, 
    treatmentTitle TEXT, 
    doi TEXT, 
    zenodoDep TEXT, 
    zoobank TEXT, 
    articleTitle TEXT, 
    publicationDate TEXT, 
    journalTitle TEXT, 
    journalYear TEXT, 
    journalVolume TEXT, 
    journalIssue TEXT, 
    pages TEXT, 
    authorityName TEXT, 
    authorityYear TEXT, 
    kingdom TEXT, 
    phylum TEXT, 
    "order" TEXT, 
    family TEXT, 
    genus TEXT, 
    species TEXT, 
    status TEXT, 
    taxonomicNameLabel TEXT, 
    rank TEXT, 
    q TEXT, 
    author TEXT,
    deleted INTEGER DEFAULT 0,
    created INTEGER DEFAULT (strftime('%s','now')),
    updated INTEGER
)`,
            
            treatmentAuthors: `CREATE TABLE IF NOT EXISTS treatmentAuthors ( 
    id INTEGER PRIMARY KEY, 
    treatmentAuthorId TEXT NOT NULL, 
    treatmentId TEXT NOT NULL, 
    treatmentAuthor TEXT,
    deleted INTEGER DEFAULT 0,
    created INTEGER DEFAULT (strftime('%s','now')),
    updated INTEGER,
    UNIQUE (treatmentAuthorId, treatmentId)
)`,
            
            materialsCitations: `CREATE TABLE IF NOT EXISTS materialsCitations ( 
    id INTEGER PRIMARY KEY, 
    materialsCitationId TEXT NOT NULL, 
    treatmentId TEXT NOT NULL, 
    collectingDate TEXT, 
    collectionCode TEXT, 
    collectorName TEXT, 
    country TEXT, 
    collectingRegion TEXT, 
    municipality TEXT, 
    county TEXT, 
    stateProvince TEXT, 
    location TEXT, 
    locationDeviation TEXT, 
    specimenCountFemale TEXT, 
    specimenCountMale TEXT, 
    specimenCount TEXT, 
    specimenCode TEXT, 
    typeStatus TEXT, 
    determinerName TEXT, 
    collectedFrom TEXT, 
    collectingMethod TEXT, 
    latitude REAL, 
    longitude REAL, 
    elevation REAL, 
    httpUri TEXT, 
    deleted INTEGER DEFAULT 0,
    created INTEGER DEFAULT (strftime('%s','now')),
    updated INTEGER,
    UNIQUE (materialsCitationId, treatmentId)
)`,
            
            treatmentCitations: `CREATE TABLE IF NOT EXISTS treatmentCitations ( 
    id INTEGER PRIMARY KEY, 
    treatmentCitationId TEXT NOT NULL, 
    treatmentId TEXT NOT NULL, 
    treatmentCitation TEXT, 
    refString TEXT, 
    deleted INTEGER DEFAULT 0, 
    created INTEGER DEFAULT (strftime('%s','now')),
    updated INTEGER,
    UNIQUE (treatmentCitationId, treatmentId) 
)`,
            
            figureCitations: `CREATE TABLE IF NOT EXISTS figureCitations ( 
    id INTEGER PRIMARY KEY, 
    figureCitationId TEXT NOT NULL, 
    treatmentId TEXT NOT NULL, 
    captionText TEXT, 
    httpUri TEXT, 
    thumbnailUri TEXT, 
    deleted INTEGER DEFAULT 0,
    created INTEGER DEFAULT (strftime('%s','now')),
    updated INTEGER,
    UNIQUE (figureCitationId, treatmentId) 
)`,
            
            bibRefCitations: `CREATE TABLE IF NOT EXISTS bibRefCitations ( 
    id INTEGER PRIMARY KEY, 
    bibRefCitationId TEXT NOT NULL, 
    treatmentId TEXT NOT NULL, 
    refString TEXT, 
    type TEXT, 
    year TEXT, 
    deleted INTEGER DEFAULT 0,
    created INTEGER DEFAULT (strftime('%s','now')),
    updated INTEGER,
    UNIQUE (bibRefCitationId, treatmentId) 
)`,
            
            vtreatments: 'CREATE VIRTUAL TABLE IF NOT EXISTS vtreatments USING FTS5(treatmentId, fullText)',
            
            vfigurecitations: 'CREATE VIRTUAL TABLE IF NOT EXISTS vfigurecitations USING FTS5(figureCitationId, captionText)',
            
            vbibrefcitations: 'CREATE VIRTUAL TABLE IF NOT EXISTS vbibrefcitations USING FTS5(bibRefCitationId, refString)',

            vlocations: 'CREATE VIRTUAL TABLE IF NOT EXISTS vlocations USING geopoly(treatmentId, materialsCitationId)'
        };

        for (let t in tables) {
            deBugger({
                debug: debug, 
                type: 'create', 
                stmt: tables[t], 
                table: t, 
                values: []
            });
        }
    },

    // store the insert statements for later use
    insertStmts: {},

    createInsertStatements: function() {

        const updateTime = Math.floor(new Date().getTime() / 1000);

        const insertStatements = {
            treatments: `INSERT INTO treatments (
                    treatmentId,
                    treatmentTitle,
                    doi,
                    zenodoDep,
                    zoobank,
                    articleTitle,
                    publicationDate,
                    journalTitle,
                    journalYear,
                    journalVolume,
                    journalIssue,
                    pages,
                    authorityName,
                    authorityYear,
                    kingdom,
                    phylum,
                    "order",
                    family,
                    genus,
                    species,
                    status,
                    taxonomicNameLabel,
                    rank,
                    q,
                    deleted
                )
                VALUES ( 
                    @treatmentId,
                    @treatmentTitle,
                    @doi,
                    @zenodoDep,
                    @zoobank,
                    @articleTitle,
                    @publicationDate,
                    @journalTitle,
                    @journalYear,
                    @journalVolume,
                    @journalIssue,
                    @pages,
                    @authorityName,
                    @authorityYear,
                    @kingdom,
                    @phylum,
                    @order,
                    @family,
                    @genus,
                    @species,
                    @status,
                    @taxonomicNameLabel,
                    @rank,
                    @q,
                    @deleted
                )
                ON CONFLICT (treatmentId)
                DO UPDATE SET
                    treatmentTitle=excluded.treatmentTitle,
                    doi=excluded.doi,
                    zenodoDep=excluded.zenodoDep,
                    zoobank=excluded.zoobank,
                    articleTitle=excluded.articleTitle,
                    publicationDate=excluded.publicationDate,
                    journalTitle=excluded.journalTitle,
                    journalYear=excluded.journalYear,
                    journalVolume=excluded.journalVolume,
                    journalIssue=excluded.journalIssue,
                    pages=excluded.pages,
                    authorityName=excluded.authorityName,
                    authorityYear=excluded.authorityYear,
                    kingdom=excluded.kingdom,
                    phylum=excluded.phylum,
                    "order"=excluded."order",
                    family=excluded.family,
                    genus=excluded.genus,
                    species=excluded.species,
                    status=excluded.status,
                    taxonomicNameLabel=excluded.taxonomicNameLabel,
                    rank=excluded.rank,
                    q=excluded.q,
                    author=excluded.author,
                    deleted=excluded.deleted,
                    updated=${updateTime}`,

            treatmentAuthors: `INSERT INTO treatmentAuthors (
                    treatmentAuthorId,
                    treatmentId,
                    treatmentAuthor,
                    deleted
                )
                VALUES ( 
                    @treatmentAuthorId,
                    @treatmentId,
                    @treatmentAuthor,
                    @deleted
                )
                ON CONFLICT (treatmentAuthorId, treatmentId)
                DO UPDATE SET
                    treatmentId=excluded.treatmentId,
                    treatmentAuthor=excluded.treatmentAuthor,
                    deleted=excluded.deleted,
                    updated=${updateTime}`,
    
            materialsCitations: `INSERT INTO materialsCitations (
                    materialsCitationId,
                    treatmentId,
                    collectingDate,
                    collectionCode,
                    collectorName,
                    country,
                    collectingRegion,
                    municipality,
                    county,
                    stateProvince,
                    location,
                    locationDeviation,
                    specimenCountFemale,
                    specimenCountMale,
                    specimenCount,
                    specimenCode,
                    typeStatus,
                    determinerName,
                    collectedFrom,
                    collectingMethod,
                    latitude,
                    longitude,
                    elevation,
                    httpUri,
                    deleted
                )
                VALUES ( 
                    @materialsCitationId,
                    @treatmentId,
                    @collectingDate,
                    @collectionCode,
                    @collectorName,
                    @country,
                    @collectingRegion,
                    @municipality,
                    @county,
                    @stateProvince,
                    @location,
                    @locationDeviation,
                    @specimenCountFemale,
                    @specimenCountMale,
                    @specimenCount,
                    @specimenCode,
                    @typeStatus,
                    @determinerName,
                    @collectedFrom,
                    @collectingMethod,
                    @latitude,
                    @longitude,
                    @elevation,
                    @httpUri,
                    @deleted
                )
                ON CONFLICT (materialsCitationId, treatmentId)
                DO UPDATE SET
                    treatmentId=excluded.treatmentId,
                    collectingDate=excluded.collectingDate,
                    collectionCode=excluded.collectionCode,
                    collectorName=excluded.collectorName,
                    country=excluded.country,
                    collectingRegion=excluded.collectingRegion,
                    municipality=excluded.municipality,
                    county=excluded.county,
                    stateProvince=excluded.stateProvince,
                    location=excluded.location,
                    locationDeviation=excluded.locationDeviation,
                    specimenCountFemale=excluded.specimenCountFemale,
                    specimenCountMale=excluded.specimenCountMale,
                    specimenCount=excluded.specimenCount,
                    specimenCode=excluded.specimenCode,
                    typeStatus=excluded.typeStatus,
                    determinerName=excluded.determinerName,
                    collectedFrom=excluded.collectedFrom,
                    collectingMethod=excluded.collectingMethod,
                    latitude=excluded.latitude,
                    longitude=excluded.longitude,
                    elevation=excluded.elevation,
                    httpUri=excluded.httpUri,
                    deleted=excluded.deleted,
                    updated=${updateTime}`,

            treatmentCitations: `INSERT INTO treatmentCitations (
                    treatmentCitationId,
                    treatmentId,
                    treatmentCitation,
                    refString,
                    deleted
                )
                VALUES ( 
                    @treatmentCitationId,
                    @treatmentId,
                    @treatmentCitation,
                    @refString,
                    @deleted
                )
                ON CONFLICT (treatmentCitationId, treatmentId)
                DO UPDATE SET
                    treatmentId=excluded.treatmentId,
                    treatmentCitation=excluded.treatmentCitation,
                    refString=excluded.refString,
                    deleted=excluded.deleted,
                    updated=${updateTime}`,

                    //thumbnailUri,
            figureCitations: `INSERT INTO figureCitations (
                    figureCitationId,
                    treatmentId,
                    captionText,
                    httpUri,
                    
                    deleted
                )
                VALUES ( 
                    @figureCitationId,
                    @treatmentId,
                    @captionText,
                    @httpUri,
                    
                    @deleted
                )
                ON CONFLICT (figureCitationId, treatmentId)
                DO UPDATE SET
                    treatmentId=excluded.treatmentId,
                    captionText=excluded.captionText,
                    httpUri=excluded.httpUri,
                    
                    deleted=excluded.deleted,
                    updated=${updateTime}`,

            bibRefCitations: `INSERT INTO bibRefCitations (
                    bibRefCitationId,
                    treatmentId,
                    refString,
                    type,
                    year,
                    deleted
                )
                VALUES ( 
                    @bibRefCitationId,
                    @treatmentId,
                    @refString,
                    @type,
                    @year,
                    @deleted
                )
                ON CONFLICT (bibRefCitationId, treatmentId)
                DO UPDATE SET
                    treatmentId=excluded.treatmentId,
                    refString=excluded.refString,
                    type=excluded.type,
                    year=excluded.year,
                    deleted=excluded.deleted,
                    updated=${updateTime}`,
        
            vtreatments: 'INSERT INTO vtreatments SELECT treatmentId, q FROM treatments WHERE deleted = 0',

            vfigurecitations: 'INSERT INTO vfigurecitations SELECT figureCitationId, captionText FROM figureCitations WHERE deleted = 0',

            vbibrefcitations: 'INSERT INTO vbibrefcitations SELECT bibRefCitationId, refString FROM bibRefCitations WHERE deleted = 0',

            vlocations: "INSERT INTO vlocations(treatmentId, materialsCitationId, _shape) SELECT treatments.treatmentId, materialsCitationId, '[[' || longitude || ',' || latitude || '],[' || longitude || ',' || latitude || '],[' || longitude || ',' || latitude || '],[' || longitude || ',' || latitude || ']]' AS _shape FROM treatments JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId WHERE latitude != '' AND longitude != ''"
        };

        for (let table in insertStatements) {
            deBugger({
                debug: debug, 
                type: 'createInsertStatements', 
                stmt: insertStatements[ table ], 
                table: table, 
                values: []
            });
        }

        
    },
    
    loadData: function(data) {

        // const counts = {
        //     treatments: data.length,
        //     treatmentAuthors   : 0, 
        //     materialsCitations : 0, 
        //     treatmentCitations : 0, 
        //     figureCitations    : 0, 
        //     bibRefCitations    : 0
        // }
        // for (let i = 0, j = data.length; i < j; i++) {
        //     if (data[i].treatmentAuthors)   counts.treatmentAuthors   += data[i].treatmentAuthors.length
        //     if (data[i].materialsCitations) counts.materialsCitations += data[i].materialsCitations.length
        //     if (data[i].treatmentCitations) counts.treatmentCitations += data[i].treatmentCitations.length
        //     if (data[i].figureCitations)    counts.figureCitations    += data[i].figureCitations.length
        //     if (data[i].bibRefCitations)    counts.bibRefCitations    += data[i].bibRefCitations.length
        // }

        /***************************************************************************
         * 
         * The data structure submitted to `loadData()` looks as follows
         * 
         * data = [ 
         * 
         *     // treatment 1 and its related data
         *     { 
         *         treatment: { },
         *         treatmentAuthors:    [ {}, {} …  ],
         *         materialCitations:   [ {}, {} …  ],
         *         treatmentCitations:  [ {}, {} …  ],
         *         figureCitations:     [ {}, {} …  ],
         *         bibRefCitations:     [ {}, {} …  ] 
         *     },
         * 
         *     // treatment 2 and its related data
         *     { 
         *         treatment: { },
         *         treatmentAuthors:    [ {}, {} …  ],
         *         materialCitations:   [ {}, {} …  ],
         *         treatmentCitations:  [ {}, {} …  ],
         *         figureCitations:     [ {}, {} …  ],
         *         bibRefCitations:     [ {}, {} …  ] 
         *     } 
         * ]
         *
         * We need to convert this hierarchical array of treatments into 
         * a separate array for each part of the treatment so they can be 
         * inserted into the separate SQL tables. However, we also have 
         * add an extra 'treatmentId' key to all the componoents of a 
         * treatment so they can be linked together in a SQL JOIN query.
         * So the above data structure will be converted to the following
         *
         * d = {
         *     treatments: [ {}, {} … ],
         *     treatmentAuthors: [ {}, {} … ],
         *     materialsCitations: [ {}, {} … ],
         *     treatmentCitations: [ {}, {} … ],
         *     figureCitations: [ {}, {} … ],
         *     bibRefCitations: [ {}, {} … ]
         * }
         * 
         ***************************************************************************/

        const d = {
            treatments: [],
            treatmentAuthors: [],
            materialsCitations: [],
            treatmentCitations: [],
            figureCitations: [],
            bibRefCitations: []
        };
  

        for (let i = 0, j = data.length; i < j; i++) {

            const t = data[i];

            for (let table in t) {
                

                if (table === 'treatment') {
                    d.treatments.push( t[ table ] );
                }
                else {
                    d[ table ].push( ...t[ table ] );
                }
            }
        }

        // const newcounts = { 
        //     new_treatments: d.treatments.length,
        //     new_treatmentAuthors   : 0,
        //     new_materialsCitations : 0,
        //     new_treatmentCitations : 0,
        //     new_figureCitations    : 0,
        //     new_bibRefCitations    : 0
        // }
        // if (d.treatmentAuthors)   newcounts.new_treatmentAuthors   += d.treatmentAuthors.length
        // if (d.materialsCitations) newcounts.new_materialsCitations += d.materialsCitations.length
        // if (d.treatmentCitations) newcounts.new_treatmentCitations += d.treatmentCitations.length
        // if (d.figureCitations)    newcounts.new_figureCitations    += d.figureCitations.length
        // if (d.bibRefCitations)    newcounts.new_bibRefCitations    += d.bibRefCitations.length

        // console.log(counts)
        // console.log(newcounts)
        
        // return

        for (let table in d) {

            if (d[ table ].length) {

                const insertMany = db.transaction((rows) => {
                    for (const row of rows) {      
                        deBugger({
                            debug: debug, 
                            type: 'insert', 
                            stmt: '', 
                            table: table, 
                            values: row
                        });
                    }
                });

                insertMany(d[ table ]);
            }
        }

        // for (let table in dataDictionary) {

        //     let d = {
        //         treatments: [],
        //         treatmentAuthors: [],
        //         materialsCitations: [],
        //         treatmentCitations: [],
        //         figureCitations: [],
        //         bibRefCitations: []
        //     }

        //     for (let i = 0, j = data.length; i < j; i++) {

        //         if (table === 'treatments') {
        //             d.treatments.push(data[i].treatment);
        //         }
        //         else {

        //             /****************************************************************************
        //              * 
        //              * While processing different parts of a 'treatment'
        //              * such as 'treatmentCitations', 'materialsCitation'
        //              * 'treatmentAuthors', 'figureCitations' and 
        //              * 'bibrefCitations' we have to check whether not the
        //              * array exists. For example, if no 'treatmentAuthors'
        //              * were found for a specific treatment, for that 
        //              * 'treatment' the 'treatmentAuthors' array will be 
        //              * undefined. In that case we don't process it because 
        //              * there is nothing to insert into the database.
        //              * 
        //              ****************************************************************************/
        //             if (typeof(data[i][table]) !== 'undefined') {

        //                 /****************************************************************************
        //                  * 
        //                  * for each component of the 'treatment', we take each 
        //                  * element of the array, ultimately a new row in the 
        //                  * database, and insert it into a separate array.
        //                  * 
        //                  ****************************************************************************/
        //                 for (let r in data[i][table]) {
        //                     d[table].push(data[i][table][r])
        //                 }
    
        //             }
                    
        //         }
        //     }

        //     const insertMany = db.transaction((rows) => {
        //         for (const row of rows) {      
        //             const r = Object.values(row);
        //             deBugger({debug: debug, type: 'insert', stmt: '', table: table, values: r});
        //         }
        //     });
            
        //     for (let t in d) {
        //         if (d[t].length) {
        //             insertMany(d[t]);
        //         }
        //     }
            
        // }
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
        for (let table in dataDictionary) {

            const columns = dataDictionary[ table ];
            let i = 0, j = columns.length;
            for (; i < j; i++) {
                const column = columns[i];
                const colname = column.plaziName.replace(/"/g, '');
                //let colName = colname.replace(/"/g, '');

                if (column.queryable) {
                    //bar.tick(1);

                    const indexStmt = `CREATE INDEX IF NOT EXISTS ix_${t}_${colname} ON ${table} (${colname}) WHERE deleted = 0`;
                    deBugger({
                        debug: debug, 
                        type: 'index', 
                        stmt: indexStmt, 
                        table: table, 
                        values: []
                    });
                }
            }
            
        }

        taxonIndexes.forEach(cols => {
            const i = cols.indexOf('"order"');
            let name = cols.join('_').replace(/"/g, '');
            const ixStmt = `CREATE INDEX IF NOT EXISTS ix_treatments_${name} ON treatments (${cols.join(', ')}) WHERE deleted = 0`;
            deBugger({
                debug: debug, 
                type: 'index', 
                stmt: ixStmt, 
                table: 'treatments', 
                values: []
            });
        });

        let facets = config.get('v2.facets');
        facets.unshift('treatmentId');
        //CREATE INDEX IF NOT EXISTS ix_treatments_facets ON treatments (deleted, treatmentId, journalTitle, journalYear, kingdom, phylum, "order", family, genus, species, status, rank) WHERE deleted = 0
        const ixStmt = `CREATE INDEX IF NOT EXISTS ix_treatments_facets ON treatments (deleted, ${facets.join(', ')}) WHERE deleted = 0`;
        deBugger({
            debug: debug, 
            type: 'index', 
            stmt: ixStmt, 
            table: 'treatments', 
            values: []
        });
    },

    indexTablesStatic: function() {

        const indexes = {
            ix_treatmentCitations_treatmentCitation  : 'CREATE INDEX ix_treatmentCitations_treatmentCitation   ON treatmentCitations (deleted, Lower(treatmentCitation)) WHERE deleted = 0',
            ix_treatmentCitations_refString          : 'CREATE INDEX ix_treatmentCitations_refString           ON treatmentCitations (deleted, Lower(refString)) WHERE deleted = 0',
            ix_bibRefCitations_year                  : 'CREATE INDEX ix_bibRefCitations_year                   ON bibRefCitations    (deleted, year) WHERE deleted = 0',
            ix_treatments_treatmentId                : 'CREATE INDEX ix_treatments_treatmentId                 ON treatments         (deleted, treatmentId)',
            ix_treatments_treatmentTitle             : 'CREATE INDEX ix_treatments_treatmentTitle              ON treatments         (deleted, treatmentTitle COLLATE NOCASE)',
            ix_treatments_articleTitle               : 'CREATE INDEX ix_treatments_articleTitle                ON treatments         (deleted, articleTitle COLLATE NOCASE)',
            ix_treatments_publicationDate            : 'CREATE INDEX ix_treatments_publicationDate             ON treatments         (deleted, publicationDate)',
            ix_treatments_journalTitle               : 'CREATE INDEX ix_treatments_journalTitle                ON treatments         (deleted, journalTitle COLLATE NOCASE)',
            ix_treatments_journalYear                : 'CREATE INDEX ix_treatments_journalYear                 ON treatments         (deleted, journalYear)',
            ix_treatments_authorityName              : 'CREATE INDEX ix_treatments_authorityName               ON treatments         (deleted, authorityName COLLATE NOCASE)',
            ix_treatments_taxonomicNameLabel         : 'CREATE INDEX ix_treatments_taxonomicNameLabel          ON treatments         (deleted, taxonomicNameLabel COLLATE NOCASE)',
            ix_treatments_kingdom                    : 'CREATE INDEX ix_treatments_kingdom                     ON treatments         (deleted, kingdom COLLATE NOCASE)',
            ix_treatments_phylum                     : 'CREATE INDEX ix_treatments_phylum                      ON treatments         (deleted, phylum COLLATE NOCASE)',
            ix_treatments_order                      : 'CREATE INDEX ix_treatments_order                       ON treatments         (deleted, "order" COLLATE NOCASE)',
            ix_treatments_family                     : 'CREATE INDEX ix_treatments_family                      ON treatments         (deleted, family COLLATE NOCASE)',
            ix_treatments_genus                      : 'CREATE INDEX ix_treatments_genus                       ON treatments         (deleted, genus COLLATE NOCASE)',
            ix_treatments_species                    : 'CREATE INDEX ix_treatments_species                     ON treatments         (deleted, species COLLATE NOCASE)',
            ix_treatments_status                     : 'CREATE INDEX ix_treatments_status                      ON treatments         (deleted, status COLLATE NOCASE)',
            ix_treatments_rank                       : 'CREATE INDEX ix_treatments_rank                        ON treatments         (deleted, rank COLLATE NOCASE)',
            ix_treatments_k_phylum                   : 'CREATE INDEX ix_treatments_k_phylum                    ON treatments         (deleted, kingdom, phylum)',
            ix_treatments_k_p_order                  : 'CREATE INDEX ix_treatments_k_p_order                   ON treatments         (deleted, kingdom, phylum, "order")',
            ix_treatments_k_p_o_family               : 'CREATE INDEX ix_treatments_k_p_o_family                ON treatments         (deleted, kingdom, phylum, "order", family)',
            ix_treatments_k_p_o_f_genus              : 'CREATE INDEX ix_treatments_k_p_o_f_genus               ON treatments         (deleted, kingdom, phylum, "order", family, genus)',
            ix_treatments_k_p_o_f_g_species          : 'CREATE INDEX ix_treatments_k_p_o_f_g_species           ON treatments         (deleted, kingdom, phylum, "order", family, genus, species)',
            ix_treatments_facets                     : 'CREATE INDEX ix_treatments_facets                      ON treatments         (deleted, treatmentId, journalTitle, journalYear, kingdom, phylum, "order", family, genus, species, status, rank)',
            ix_treatments_deleted                    : 'CREATE INDEX ix_treatments_deleted                     ON treatments         (deleted)',
            ix_treatmentAuthors_treatmentAuthorId    : 'CREATE INDEX ix_treatmentAuthors_treatmentAuthorId     ON treatmentAuthors   (deleted, treatmentAuthorId)',
            ix_treatmentAuthors_treatmentId          : 'CREATE INDEX ix_treatmentAuthors_treatmentId           ON treatmentAuthors   (deleted, treatmentId)',
            ix_treatmentAuthors_treatmentAuthor      : 'CREATE INDEX ix_treatmentAuthors_treatmentAuthor       ON treatmentAuthors   (deleted, treatmentAuthor COLLATE NOCASE)',
            ix_treatmentAuthors_deleted              : 'CREATE INDEX ix_treatmentAuthors_deleted               ON treatmentAuthors   (deleted)',
            ix_materialsCitations_materialsCitationId: 'CREATE INDEX ix_materialsCitations_materialsCitationId ON materialsCitations (deleted, materialsCitationId)',
            ix_materialsCitations_treatmentId        : 'CREATE INDEX ix_materialsCitations_treatmentId         ON materialsCitations (deleted, treatmentId)',
            ix_materialsCitations_collectingDate     : 'CREATE INDEX ix_materialsCitations_collectingDate      ON materialsCitations (deleted, collectingDate COLLATE NOCASE)',
            ix_materialsCitations_collectionCode     : 'CREATE INDEX ix_materialsCitations_collectionCode      ON materialsCitations (deleted, collectionCode COLLATE NOCASE)',
            ix_materialsCitations_collectorName      : 'CREATE INDEX ix_materialsCitations_collectorName       ON materialsCitations (deleted, collectorName COLLATE NOCASE)',
            ix_materialsCitations_country            : 'CREATE INDEX ix_materialsCitations_country             ON materialsCitations (deleted, country COLLATE NOCASE)',
            ix_materialsCitations_collectingRegion   : 'CREATE INDEX ix_materialsCitations_collectingRegion    ON materialsCitations (deleted, collectingRegion COLLATE NOCASE)',
            ix_materialsCitations_municipality       : 'CREATE INDEX ix_materialsCitations_municipality        ON materialsCitations (deleted, municipality COLLATE NOCASE)',
            ix_materialsCitations_county             : 'CREATE INDEX ix_materialsCitations_county              ON materialsCitations (deleted, county COLLATE NOCASE)',
            ix_materialsCitations_stateProvince      : 'CREATE INDEX ix_materialsCitations_stateProvince       ON materialsCitations (deleted, stateProvince COLLATE NOCASE)',
            ix_materialsCitations_location           : 'CREATE INDEX ix_materialsCitations_location            ON materialsCitations (deleted, location COLLATE NOCASE)',
            ix_materialsCitations_locationDeviation  : 'CREATE INDEX ix_materialsCitations_locationDeviation   ON materialsCitations (deleted, locationDeviation COLLATE NOCASE)',
            ix_materialsCitations_specimenCountFemale: 'CREATE INDEX ix_materialsCitations_specimenCountFemale ON materialsCitations (deleted, specimenCountFemale COLLATE NOCASE)',
            ix_materialsCitations_specimenCountMale  : 'CREATE INDEX ix_materialsCitations_specimenCountMale   ON materialsCitations (deleted, specimenCountMale COLLATE NOCASE)',
            ix_materialsCitations_specimenCount      : 'CREATE INDEX ix_materialsCitations_specimenCount       ON materialsCitations (deleted, specimenCount COLLATE NOCASE)',
            ix_materialsCitations_specimenCode       : 'CREATE INDEX ix_materialsCitations_specimenCode        ON materialsCitations (deleted, specimenCode COLLATE NOCASE)',
            ix_materialsCitations_typeStatus         : 'CREATE INDEX ix_materialsCitations_typeStatus          ON materialsCitations (deleted, typeStatus COLLATE NOCASE)',
            ix_materialsCitations_determinerName     : 'CREATE INDEX ix_materialsCitations_determinerName      ON materialsCitations (deleted, determinerName COLLATE NOCASE)',
            ix_materialsCitations_collectedFrom      : 'CREATE INDEX ix_materialsCitations_collectedFrom       ON materialsCitations (deleted, collectedFrom COLLATE NOCASE)',
            ix_materialsCitations_collectingMethod   : 'CREATE INDEX ix_materialsCitations_collectingMethod    ON materialsCitations (deleted, collectingMethod COLLATE NOCASE)',
            ix_materialsCitations_latitude           : 'CREATE INDEX ix_materialsCitations_latitude            ON materialsCitations (deleted, latitude)',
            ix_materialsCitations_longitude          : 'CREATE INDEX ix_materialsCitations_longitude           ON materialsCitations (deleted, longitude)',
            ix_materialsCitations_elevation          : 'CREATE INDEX ix_materialsCitations_elevation           ON materialsCitations (deleted, elevation)',
            ix_materialsCitations_deleted            : 'CREATE INDEX ix_materialsCitations_deleted             ON materialsCitations (deleted)',
            ix_treatmentCitations_treatmentCitationId: 'CREATE INDEX ix_treatmentCitations_treatmentCitationId ON treatmentCitations (deleted, treatmentCitationId)',
            ix_treatmentCitations_treatmentId        : 'CREATE INDEX ix_treatmentCitations_treatmentId         ON treatmentCitations (deleted, treatmentId)',
            ix_treatmentCitations_deleted            : 'CREATE INDEX ix_treatmentCitations_deleted             ON treatmentCitations (deleted)',
            ix_figureCitations_treatmentId           : 'CREATE INDEX ix_figureCitations_treatmentId            ON figureCitations    (deleted, treatmentId)',
            ix_figureCitations_figureCitationId      : 'CREATE INDEX ix_figureCitations_figureCitationId       ON figureCitations    (deleted, figureCitationId, treatmentId)',
            ix_bibRefCitations_bibRefCitationId      : 'CREATE INDEX ix_bibRefCitations_bibRefCitationId       ON bibRefCitations    (deleted, bibRefCitationId)',
            ix_bibRefCitations_treatmentId           : 'CREATE INDEX ix_bibRefCitations_treatmentId            ON bibRefCitations    (deleted, treatmentId)',
            ix_bibRefCitations_deleted               : 'CREATE INDEX ix_bibRefCitations_deleted                ON bibRefCitations    (deleted)',
        }

        for (let i in indexes) {
            deBugger({
                debug: debug, 
                type: 'index', 
                stmt: indexes[i], 
                table: i, 
                values: []
            });
        }
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