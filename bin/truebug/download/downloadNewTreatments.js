'use strict';

const download = require('download');

const config = require('config');
const downloadDir = config.get('download-program.newTreatmentsDir');

const downloadTreatmentsURL = config.get('download-program.downloadTreatmentsURL');

const logger = require(config.get('logger'));


module.exports = {

    downloadNewTreatments: function(treatmentIDs) {
        
        const start = new Date().getTime();
        let hostType = 'localhost';            

            // Check if it's in production
            if (process.env.NODE_ENV === 'production') {
                hostType = 'production';
            };

        if (treatmentIDs.length > 0) {        

            for (let i = 0, j = treatmentIDs.length; i < j; i++) {

                let url = downloadTreatmentsURL + treatmentIDs[i] + '.xml';

                download(url, downloadDir).catch((error) => {
                    
                    logger({
                        host: hostType,                    
                        start: start,
                        end: new Date().getTime(),
                        status: '400',
                        resource: 'download-treatmentsXML',
                        // query: n,
                        message: `FAILED XML download for ID [${treatmentIDs[i]}]. Error: ${error.name}.`
                    });

                });                                                
            }
        } 
    }
}