'use strict';

const fs = require('fs');
const path = require('path');
const Config = require('../config');
const Debug = require('debug')('renew   :');
const { performance } = require('perf_hooks');

// download new files zip archive
const download = require('./renew/download');
download.msg();

// unzip new file zip archive
const unzip = require('./renew/unzip');
unzip.msg();

// compare new files with old files
const compare = require('./renew/compare');
// const oldxmldir = `${Config.data}/plazi-xml-old`;
const xmldir = `${Config.data}/treatmentxmls`;
// const fileNewArr = fs.readdirSync(newxmldir);
// const [same, diff] = compare.sift(fileNewArr, oldxmldir);
// console.log(`same: ${same.length}`);
// console.log(`diff: ${diff.length}`);

// import added new files to db
const db = require('./renew/db');
db.createTables();

// parse xml
Debug('parsing and loading treatments');
const t0 = performance.now();
const parsex = require('./renew/parsex');
const xmlsArr = fs.readdirSync(xmldir);
let i = 0;
let j = xmlsArr.length;
let treatments = [];
let batch = 10000;

for (; i < j; i++) {
    if (i == 0) {
        //Debug('begin parsing treatment xmls…');
    }
    else {
        if (!(i % batch)) {
            Debug(`parsed ${batch} treatment xmls`);
            db.loadTreatments(treatments);
            
            treatments = [];
        }
    }

    const xml = fs.readFileSync(`${xmldir}/${xmlsArr[i]}`, 'utf8');
    const treatment_id = path.basename(xmlsArr[i], '.xml');
    const [tr, mc, tc] = parsex.cheerioparse(xml, treatment_id);
    
    treatments.push(tr);
    //Debug(mc)
    db.loadMaterialCitations(mc);
    db.loadTreatmentCitations(tc);
}

db.loadTreatments(treatments);

db.indexTreatments();
db.loadFTSTreatments();
const t1 = performance.now();
Debug('parsing and loading ' + i + ' treatments took' + (t1 - t0) + ' ms')

// add FTS rows for newly added files