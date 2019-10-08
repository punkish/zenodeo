'use strict';

const fs = require('fs');
const path = require('path');
const config = require('config');
const dir = config.get('xmlDumpDir');
const parse = require('./truebug/parse');

const xmls = fs.readdirSync(dir);
const numOfFiles = xmls.length;

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

const xml = xmls[getRandomInt(numOfFiles)];
//console.log(path.basename(xml, '.xml'));
parse(path.basename(xml, '.xml'))