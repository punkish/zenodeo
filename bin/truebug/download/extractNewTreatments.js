'use strict';

const fs = require('fs');
const cheerio = require('cheerio');

const config = require('config');
const treatmentListDir = config.get('download-program.treatmentsListDir');

module.exports = {

    extractNewTreatments: function(newTreatmentsXML) {

        const xml = fs.readFileSync(newTreatmentsXML, 'utf8')

        const $ = cheerio.load(xml, {
            normalizeWhitespace: true,
            xmlMode: true
        });

        const treatmentIDs = [];

        // Iteracts into the cheerio object and retrieved all values for attributes 'docId'
        $('document').each(function(i, e) {
            treatmentIDs.push($(this).attr('docId'));
        });

        return treatmentIDs
    }
}