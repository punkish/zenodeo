'use strict';

const download = require('download');

const base_url = 'http://tb.plazi.org/GgServer/xml/';
const downloadDir = '../../../data/treatmentsNew2';


module.exports = {

    downloadNewTreatments: function(treatmentIDs) {
        
        if (treatmentIDs.length) {

            // I tried to create a counter with the number of
            // downloads, but the async part of javascript stopped me

            for (let i = 0, j = treatmentIDs.length; i < j; i++) {

                let url = base_url + treatmentIDs[i] + '.xml';

                download(url, downloadDir);
            }        
        }

        else {
            console.log("There are no new treatments to be downloaded.");
        }
    }
}