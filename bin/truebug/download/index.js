'use strict';

const fs = require('fs');
const download = require('download');

const td = require('./downloadNewTreatments');
const tIDs = require('./extractNewTreatments');

const config = require('config');
const pathToTimestamp = config.get('paths.timestampDir');
const treatmentListDir = config.get('paths.treatmentsListDir');

let treatmentListURL = config.get('URLs.downloadListURL');


    
const ddd = {

    readTS: function() {
        return fs.readFileSync(pathToTimestamp, 'utf8')
    },

    writeTimestamp: function(nowTS) {
        fs.writeFileSync(pathToTimestamp, nowTS, 'utf8')
    },

    getTreatmentList: function(latestTS) {

        console.log(treatmentListURL)

        treatmentListURL += this.readTS()

        console.log(treatmentListURL)

        console.log(treatmentListDir)
    }
}


// ddd.getTreatmentList()

// console.log(pathToTimestamp)


const treatmentIDs = [
    '006F87D3FFC5EC39B594F9F8FC44D7B3',
    '006F87D3FFE0EC1DB594FC70FD9FD4B5',
    '006F87D3FFE1EC1DB594FDC0FC32D0D2',
    '006F87D3FFE2EC11B594F889FAACD3A2',
    '006F87D3FFE3EC1EB594FBD9FE92D518'
];

const treatmentIDs2 = [];


td.downloadNewTreatments(treatmentIDs)

// FUNCION: Getting XML Dump Based on Timestamp recorded somewhere (probably sqlite db with other logging info)

// const a = new Date();
// const newTimeStamp = 'http://tb.plazi.org/GgServer/search?&indexName=0&resultFormat=XML&lastModifiedSince=' + a.setHours(a.getHours() -4)
// console.log(newTimeStamp)
// download(newTimeStamp, downloadDir);

// download.downloadNewTreatments(idsList.extractNewTreatments(pathToXML))
//download.downloadNewTreatments(treatmentIDs)

/* Playing around with Date() and timestamps
let hj = new Date()
let hjTS = new Date().getTime()
let lastDown = new Date(timestamp.latest)

let lastDownTS = timestamp.latest

let newnewDate = new Date(hj - (hj - lastDown))

console.log(hj)
console.log(hjTS)
console.log()
console.log(lastDown)
console.log(lastDownTS)
console.log()
console.log(newnewDate)
console.log(hj - (hj - lastDown))

timestamp.latest = 'bbb'
*/

/*
const nowTS = new Date().getTime();

console.log(nowTS)

fs.writeFileSync(timestamp, nowTS, 'utf8');
*/

// fs.writeFileSync('reports/variance-on-attr-type.tsv', rep, 'utf8');

// TO DO: For the Log
// Time that started; How many files it was downloaded; When it finished;