'use strict';

const fs = require('fs');

const config = require('config');
const srcdir = config.get('xmlDumpDir'); 
const destdir = config.get('xmlRearrangedDest');

module.exports = function(file) {
    const one = file.substr(0, 1);
    const two = file.substr(0, 2);
    const thr = file.substr(0, 3);

    const src = `${srcdir}/${file}`;
    const dest = `${destdir}/${one}/${two}/${thr}`;

    fs.mkdirSync(dest, {recursive: true});
    fs.copyFileSync(src, `${dest}/${file}`);
}
