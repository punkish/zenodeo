'use strict'

const config = require('config')
const Utils = require('../../api/v2/utils')
const opts = require('./lib/opts')
const download = require('./download')
const parse = require('./parse')
const database = require('./database')
const plog = require(config.get('plog'))

let timer = process.hrtime()

// download new files zip archive
if (opts.download) download(opts.download)

if (opts.database) {

    // tables will get created if they don't already exist
    database.createTablesStatic()

    // insert statements will be prepared and stored to run
    // as transactions
    database.createInsertStatements()
}

if (opts.parse) parse(opts.parse, opts.rearrange, opts.database)
if (opts.database) database.indexTablesStatic()

timer = process.hrtime(timer);
// plog.logger({
//     host: 'localhost',
//     start: 'start',
//     end: 'end',
//     status: 200,
//     resource: 'parse',
//     query: `parsed`,
//     message: Utils.timerFormat(timer)
// });