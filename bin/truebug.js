'use strict';

const opts = require('./truebug/opts')
//const download = require('./truebug/download');
const parse = require('./truebug/parse');

if (opts.download) {

    // download new files zip archive
    download();
}

if (opts.parse) {
    
    parse(opts.parse, opts.rearrange, opts.database);
    
}