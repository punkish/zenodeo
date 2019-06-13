'use strict';

const fs = require('fs');
const download = require('download');
const path = require('path');
const config = require('config');

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
        // SELECT start FROM log WHERE resource='download-listTreatment' ORDER BY id DESC LIMIT 1; 
    },

    writeTimestamp: function(nowTS) {
        fs.writeFileSync(pathToTimestamp, nowTS, 'utf8')
        console.log(`TimeStamp ${nowTS} Updated!`)
    },

    getTreatmentList: function() {

        const start = new Date().getTime();
        let hostType = 'localhost';

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
                //treatmentIDs = ["03EE87AEFFA2FF8EFEE7F8888B670DA5", "03EE87AEFFA0FF8FFEFBF7228F1E05A2", "03EE87AEFFA6FF8DFEEAF5FF898F06C3", "banana"]
                
                // Write the new timestamp into the current 'database'
                const nowTS = new Date()
                this.writeTimestamp(nowTS.getTime())

                logger({
                    host: hostType,
                    start: start,
                    end: new Date().getTime(),
                    status: '200',
                    resource: 'download-listTreatments',
                    // query: n,
                    message: `The file ${treatmentListFile} was downloaded correctly, and contains ${treatmentIDs.length} treatments: ${JSON.stringify(treatmentIDs)}.`,
                });

                td.downloadNewTreatments(treatmentIDs)
            }
        }).catch((error) => {
                        
            logger({
                host: hostType,                    
                start: start,
                end: new Date().getTime(),
                status: '400',
                resource: 'download-listTreatments',
                // query: n,
                message: `Couldn't download ${treatmentListFile}. Error: ${error.name}.`,
            })
        });
    }
}


downloadAndUpdate.getTreatmentList()