'use strict';

// const fs = require('fs');
// const timer = require('./renew/utils')
const params = require('./renew/opts')
const download = require('./renew/download');
const database = require('./renew/database');
const parsex = require('./renew/parsex');
const rearrangefile = require('./renew/rearrangefiles');
const config = require('config');

const xmlDumpDir = config.get('bin.renew.xmlDumpDir');

const interval = setInterval(log, 1000)


if (params.download) {

    // download new files zip archive
    download();
}

if (params.database) {

    // create tables in the database *only* if they don't already exist
    database.createTables();
}


if (params.parseOne) {
    
    const treatment = parsex.parseOne(params.parseOne)
    console.log(treatment)

}
else if (params.parseAll) {

    /*
    const xmlsArr = fs.readdirSync(xmlDumpDir);

    let i = 0;
    let j = xmlsArr.length;
    
    const batch = 1000;
    let count = 0;
    let treatments = [];
    let parseStart;
    
    for (; i < j; i++) {

        if (i == 0) {
            parseStart = timer({ startMsg: 'Started parsing… '});
        }

        if (params.rearrange) {

            // rearrange XMLs into a hierachical structure
            rearrangefile(xmlsArr[i])
        }
        
        treatments.push(parsex.parseOne(xmlsArr[i]))
    
        if (!(i % batch)) {

            timer({ startTime: parseStart });
            parseStart = timer({ startMsg: `Parsed ${i} XMLs. Next ${batch} XMLs… `});
            count = count + batch;
            database.loadData(treatments);
            treatments = [];
                
        }
        
    }
    
    database.loadData(treatments);
    */

    database.indexTables();
    // database.loadFTSTreatments();

    // database.countRows();
}


//timer({ startTime: t0 });