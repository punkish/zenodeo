'use strict';

const fs = require('fs');
const download = require('download');
const path = require('path');

const td = require('./downloadNewTreatments');
const tIDs = require('./extractNewTreatments');

const config = require('config');
const pathToTimestamp = config.get('paths.timestampDir');
const treatmentListDir = config.get('paths.treatmentsListDir');

let treatmentListURL = config.get('URLs.downloadListURL');


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
            filename: 'listOfTreatments.xml'
        }).then(() => {

            // Build the path to the listOfTreatments.xml
            const path = treatmentListDir + '\\listOfTreatments.xml'

            // Call the functions that extracts the IDs and download the *.xmls
            td.downloadNewTreatments(tIDs.extractNewTreatments(path))

            // Writes the new timestamp into the current 'database'
            const nowTS = new Date()
            this.writeTimestamp(nowTS.getTime())
            })
        }
    }


downloadAndUpdate.getTreatmentList()

// Add filename of the list of treatments file to config.