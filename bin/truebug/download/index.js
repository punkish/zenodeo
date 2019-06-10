'use strict';

const fs = require('fs');
const download = require('download');
const path = require('path');
const config = require('config');

const logger = require(config.get('logger'))

const td = require('./downloadNewTreatments');
const tIDs = require('./extractNewTreatments');


/*
const pathToTimestamp = config.get('paths.timestampDir');
const treatmentListDir = config.get('paths.treatmentsListDir');
const treatmentListFile = config.get('filename.treatmentsListFilename')
*/

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

        download(treatmentListURL + this.readTS(), treatmentListDir, {
            filename: treatmentListFile
        }).then(() => {

            // Build the path to the listOfTreatments.xml
            const filePath = path.join(treatmentListDir, treatmentListFile)

            // Call the functions that extracts the IDs and download the *.xmls
            td.downloadNewTreatments(tIDs.extractNewTreatments(filePath))

            // Writes the new timestamp into the current 'database'
            const nowTS = new Date()
            this.writeTimestamp(nowTS.getTime())
            })
        }
    }


downloadAndUpdate.getTreatmentList()

/*
console.log(pathToTimestamp)
console.log(treatmentListDir)
console.log(treatmentListFile)
*/