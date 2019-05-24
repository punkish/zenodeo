'use strict';

const download = require('./downloadNewTreatments')
const idsList = require('./extractNewTreatments');

const pathToXML = '../../../data/search.xml';

// Testing the program

/* 

// Testing lists

const treatmentIDs = [
    '006F87D3FFC5EC39B594F9F8FC44D7B3',
    '006F87D3FFE0EC1DB594FC70FD9FD4B5',
    '006F87D3FFE1EC1DB594FDC0FC32D0D2',
    '006F87D3FFE2EC11B594F889FAACD3A2',
    '006F87D3FFE3EC1EB594FBD9FE92D518'
];

const treatmentIDs2 = []
*/

// FUNCION: Getting XML Dump Based on Timestamp recorded somewhere (probably sqlite db with other logging info)

// const a = new Date();
// const newTimeStamp = 'http://tb.plazi.org/GgServer/search?&indexName=0&resultFormat=XML&lastModifiedSince=' + a.setHours(a.getHours() -4)
// console.log(newTimeStamp)
// download(newTimeStamp, downloadDir);

download.downloadNewTreatments(idsList.extractNewTreatments(pathToXML))

// TO DO: For the Log
// Time that started; How many files it was downloaded; When it finished;