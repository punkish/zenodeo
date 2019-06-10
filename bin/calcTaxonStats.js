'use strict';

const Database = require('better-sqlite3');
const config = require('config');
const db = new Database(config.get('data.treatments'));

const getStats = function(obj) {

    let cols = [];
    let vals = [];

    for (let col in obj) {

        vals.push( obj[col] )

        // we add double quotes to 'order' otherwise the 
        // sql statement would choke since order is a  
        // reserved word
        if (col === 'order') col = '"order"';
        cols.push(col + ' = ?');

    }

    let select = `SELECT Count(*) FROM treatments WHERE ${cols.join(' AND ')}`;
    return db.prepare(select).all(vals)

    const taxon = [
        'kingdom',
        'phylum',
        'order',
        'family',
        'genus',
        'species'
    ]
}