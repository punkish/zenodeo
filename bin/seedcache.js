'use strict';

const fs = require('fs');
const readline = require('readline');
    //stream = require('stream');

const instream = fs.createReadStream('../js/family.min.js');
var outstream = new stream;
outstream.readable = true;
outstream.writable = true;

var rl = readline.createInterface({
    input: instream,
    output: outstream,
    terminal: false
});

rl.on('line', function(line) {
    console.log(line);
    //Do your stuff ...
    //Then write to outstream
    rl.write(cubestuff);
});