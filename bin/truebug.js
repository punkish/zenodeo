'use strict';

const opts = require('./truebug/opts')
const download = require('./truebug/download');
const parse = require('./truebug/parse');
const database = require('./truebug/database');

// download new files zip archive
if (opts.download) {
    download(opts.download);
}

// if (opts.database) {
//     database.createTablesStatic();
// }

if (opts.parse) {
    parse(opts.parse, opts.rearrange, opts.database);
}

// if (opts.database) {
//     database.indexTablesStatic();
// }