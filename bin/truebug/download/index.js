'use strict';

const fs = require('fs');
const download = require('download');
const path = require('path');
const config = require('config');

const { performance } = require('perf_hooks');
const logger = require(config.get('logger'));

const td = require('./downloadNewTreatments');
const tIDs = require('./extractNewTreatments');

const pathToTimestamp = config.get('download-program.timestampDir');
const treatmentListDir = config.get('download-program.treatmentsListDir');
const treatmentListFile = config.get('download-program.treatmentsListFilename');

let treatmentListURL = config.get('download-program.downloadListURL');


const downloadAndUpdate = {

    readTS: function() {
        return fs.readFileSync(pathToTimestamp, 'utf8')
    },

    writeTimestamp: function(nowTS) {
        fs.writeFileSync(pathToTimestamp, nowTS, 'utf8')
        console.log(`TimeStamp ${nowTS} Updated!`)
    },

    getTreatmentList: function(latestTS) {

        let url = 'http://tb.plazi.org/GgServ'

        const start = performance.now().toFixed(2);
        let hostType = '';

        // Check if it's in production
        if (process.env.NODE_ENV === 'production') {
            hostType = 'production';
        } else {
            hostType = 'localhost';
        };

        download(treatmentListURL + this.readTS(), treatmentListDir, {
            filename: treatmentListFile
        }).then((response) => {

            if(response) {
                // Build the path to the listOfTreatments.xml
                const filePath = path.join(treatmentListDir, treatmentListFile)

                // Call the functions that extracts the IDs and download the *.xmls
                td.downloadNewTreatments(tIDs.extractNewTreatments(filePath))

                // Write the new timestamp into the current 'database'
                const nowTS = new Date()
                this.writeTimestamp(nowTS.getTime())

                logger({
                    host: hostType,
                    start: start,
                    end: performance.now().toFixed(2),
                    status: 'success',
                    resource: 'download.treatmentsList',
                    // query: n,
                    message: `The file ${treatmentListFile} was downloaded correctly.`
                });
            }
        }).catch((error) => {
            
            logger({
                host: hostType,                    
                start: start,
                end: performance.now().toFixed(2),
                status: 'failed',
                resource: 'download.treatmentsList',
                // query: n,
                message: `Couldn't download ${treatmentListFile} - ${error}.`
            });
        })
    }
}


downloadAndUpdate.getTreatmentList()