'use strict';

const config = require('config');
const plog = require(config.get('plog'));
const dd = require('../../../dataDictionary/dd');

const createTable = function(table) {
    const rdd = dd[table];

    const columns = [];
    for (let i = 0, j = rdd.length; i < j; i++) {

        let name = rdd[i].plaziName;
        const type = rdd[i].sqlType;
        const desc = rdd[i].description;

        if (type) {
            if (name === 'order') name = '"order"';
            columns.push({ name: name, type: type, desc: desc })
        }
    }

    const sql = `\nCREATE TABLE IF NOT EXISTS ${table} (\n\t${columns.map(e => `\n\t-- ${e.desc}\n\t${e.name} ${e.type}`).join(',\n\t')}\n)`;

    plog.info('sql', sql);
};

const createIndexes = function(table) {
    
    const messages = [];
    const rdd = dd[table];
    let pk;

    for (let i = 0, j = rdd.length; i < j; i++) {

        const queryable = rdd[i].queryable || false;
        const column = rdd[i].plaziName;

        if (rdd[i].resourceId) pk = column;
        
        if (queryable) {
            
            let sql;

            if (queryable === 'like') {
                sql = `CREATE INDEX IF NOT EXISTS ix_${table}_${column} ON ${table} (deleted, ${column} COLLATE NOCASE)`;
            }
            else if (queryable === 'equal') {
                sql = `CREATE INDEX IF NOT EXISTS ix_${table}_${column} ON ${table} (deleted, ${column})`;
            }
            else if (queryable === 'match') {
                const ftstable = rdd[i].fts.table;

                sql = `CREATE VIRTUAL TABLE IF NOT EXISTS ${ftstable} USING FTS5(${pk}, ${column})`;

                sql = `INSERT INTO ${ftstable} SELECT ${pk}, ${column} FROM ${table} WHERE deleted = 0`;
            }

            messages.push({label: 'sql', params: sql});
        }
        
    }


    if (table === 'treatments') {
        const msgs = createTaxonIndexes();
        messages.push(...msgs);    
    }

    plog.log({header: table, messages: messages});
};

// additional indexes on taxon classifications to calc taxon stats
const createTaxonIndexes = function() {

    const messages = [];
    
    const taxonIndexes = [
        ['kingdom', 'phylum'],
        ['kingdom', 'phylum', '"order"'],
        ['kingdom', 'phylum', '"order"', 'family'],
        ['kingdom', 'phylum', '"order"', 'family', 'genus'],
        ['kingdom', 'phylum', '"order"', 'family', 'genus', 'species']
    ];

    for (let i = 0, j = taxonIndexes.length; i < j; i++) {
        const cols = taxonIndexes[i];
        let name = cols.join('_').replace(/"/g, '');
        const sql = `CREATE INDEX IF NOT EXISTS ix_treatments_${name} ON treatments (${cols.join(', ')}) WHERE deleted = 0`;
        messages.push({label: 'sql', params: sql});
    }

    return messages;
}

for (let resources in dd) {
    createTable(resources);
    createIndexes(resources);
}