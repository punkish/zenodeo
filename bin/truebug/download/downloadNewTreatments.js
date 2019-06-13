'use strict';

const download = require('download');

const progress = require('progress');

const config = require('config');
const downloadDir = config.get('download-program.newTreatmentsDir');

const downloadTreatmentsURL = config.get('download-program.downloadTreatmentsURL');

const logger = require(config.get('logger'));

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

            const start = new Date().getTime();
            let hostType = '';

            // Check if it's in production
            if (process.env.NODE_ENV === 'production') {
                hostType = 'production';
            } else {
                hostType = 'localhost';
            };

            for (let i = 0, j = treatmentIDs.length; i < j; i++) {

                let url = downloadTreatmentsURL + treatmentIDs[i] + '.xml';
                
                //url = 'https://proxy.duckduckgo.com/iu/?u=https%3A%2F%2Ffiles.brightside.me%2Ffiles%2%2F46555%2F206355-1250'
                /*
                url = downloadTreatmentsURL + 'FA2A8793CA55F177E2CC8A1AFBAA8975banana.xml'
                url = 'http://tb.plazi.org/GgServer/search?&indexName=0&resultFormat=XML&lastModifiedSince=1559070451315'
                */

                download(url, downloadDir)
                    .then((response) => {
                        if (response) {
                            
                            logger({
                                host: hostType,                    
                                start: start,
                                end: new Date().getTime(),
                                status: '200',
                                resource: 'download-program',
                                // query: n,
                                message: `The XML file for treatment ${treatmentIDs[i]} was successfully downloaded.`
                            });
                        }
                    })
                    .catch((error) => {
                        
                        logger({
                            host: hostType,                    
                            start: start,
                            end: new Date().getTime(),
                            status: '400',
                            resource: 'download-program',
                            // query: n,
                            message: `Couldn't download XML for treatment ${treatmentIDs[i]} - ${error}.`
                        });
                    });
                }        
            }

        else {
            
            logger({
                host: hostType,                    
                start: start,
                end: new Date().getTime(),
                status: '200',
                resource: 'download-program',
                // query: n,
                message: `No new treatments were found.`
            });
        }
    }
}