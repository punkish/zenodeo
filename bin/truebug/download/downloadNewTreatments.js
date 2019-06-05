'use strict';

const download = require('download');
const progress = require('progress');

const config = require('config');
const downloadDir = config.get('download-program.newTreatmentsDir');

const downloadTreatmentsURL = config.get('download-program.downloadTreatmentsURL');

// Logic behind progress bar:
// I'll have to use a file watches (chokidar) to watch the folder
// I'll then create it with a permanent instance.
// Then, for every download(), I'll use a counter in a .then, to get
// all successfull http requests.
// Finally, when the folder has the same amount of files as the expected, I can stop
// the watcher. 

module.exports = {

    downloadNewTreatments: function(treatmentIDs) {
        
        if (treatmentIDs.length) {

            // I tried to create a counter with the number of
            // downloads, but the async part of javascript stopped me
            // for now. I'll come back to this later.

            const j = treatmentIDs.length;
            /*
            // update the progress bar every x% of the total num of files
            // but x% of j should not be more than 10000
            let x = 10;
            if ((j / x) > 10000) {
                x = Math.floor(j / 10000);
            }
            */
           /*
            const tickInterval = Math.floor(j * 0.10);
            const bar = new progress('  processing [:bar] :rate files/sec :percent :etas', {
                complete: '=',
                incomplete: ' ',
                width: 30,
                total: treatmentIDs.length
            });
            */

            for (let i = 0, j = treatmentIDs.length; i < j; i++) {

                let url = downloadTreatmentsURL + treatmentIDs[i] + '.xml';

                download(url, downloadDir);
            }        
        }

        else {
            console.log("There are no new treatments to be downloaded.");
        }
    }
}