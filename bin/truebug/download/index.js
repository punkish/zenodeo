'use strict';

const download = require('download');
const path = require('path');
const config = require('config');

const logger = require(config.get('logger'));
const Database = require('better-sqlite3');
const db = new Database(config.get('data.logs'));

const td = require('./downloadNewTreatments');
const tIDs = require('./extractNewTreatments');

const treatmentListDir = config.get('download-program.treatmentsListDir');
const treatmentListFile = config.get('download-program.treatmentsListFilename');

let treatmentListURL = config.get('download-program.downloadListURL');


const downloadAndUpdate = {

    readTS: function() {
        
        const myQuery = db.prepare('SELECT start FROM log WHERE resource="download-listTreatments" ORDER BY id DESC LIMIT 1')

        // Get the result from the query
        let latestTS = myQuery.all()[0]['start']
        
        // Remove final '.0' from the timestamp in logs database
        let removeFinal = latestTS.length - 2
        latestTS = latestTS.slice(0, removeFinal)

        return latestTS
    },

    getTreatmentList: function() {

        const start = new Date().getTime();
        let hostType = 'localhost';
        let control = false;
        let message = '';

        // Check if it's in production
        if (process.env.NODE_ENV === 'production') {
            hostType = 'production';
        };

        download(treatmentListURL + this.readTS(), treatmentListDir, {
            filename: treatmentListFile
        }).then((response) => {

            if(response) {
                // Build the path to the listOfTreatments.xml
                const filePath = path.join(treatmentListDir, treatmentListFile)

                // Call the functions that extracts the IDs and download the *.xmls
                let treatmentIDs = tIDs.extractNewTreatments(filePath)

                if (treatmentIDs.length > 0) {
                    message = `The file ${treatmentListFile} was correctly downloaded, and contains ${treatmentIDs.length} treatments: ${JSON.stringify(treatmentIDs)}.`;
                } else {
                    message = `The file ${treatmentListFile} was correctly downloaded, and contains ${treatmentIDs.length} treatments.`;
                }

                logger({
                    host: hostType,
                    start: start,
                    end: new Date().getTime(),
                    status: '200',
                    resource: 'download-listTreatments',
                    // query: n,
                    message: message,
                });

                control = true;

                td.downloadNewTreatments(treatmentIDs)
            }
        }).catch((error) => {
            
            if (control == false) {
                logger({
                    host: hostType,                    
                    start: start,
                    end: new Date().getTime(),
                    status: '400',
                    resource: 'download-listTreatments',
                    // query: n,
                    message: `Couldn't download ${treatmentListFile}. Error: ${error.name}.`,
                })
            } else {
                logger({
                    host: hostType,                    
                    start: start,
                    end: new Date().getTime(),
                    status: '400',
                    resource: 'download-listTreatments',
                    // query: n,
                    message: `Something is wrong with the download XML URL. Error: ${error.name}.`,
                })
            }
        });
    }
}


downloadAndUpdate.getTreatmentList()