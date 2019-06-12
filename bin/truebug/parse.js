'use strict';

const fs = require('fs');
const path = require('path');
const progress = require('progress');
const cheerio = require('cheerio');
const { performance } = require('perf_hooks');

const config = require('config');
const dataDict = require(config.get('v2.dataDict'));
const xmlDumpDir = config.get('xmlDumpDir');
const logger = require(config.get('logger'));

// truebug modules
const rearrange = require('./rearrange');
const database = require('./database');

/*
 * One treatment has several attributes plus
 *      0 or more treatmentCitations
 *      0 or more treatmentAuthors
 *      0 or more materialCitations
 *      0 or more bibRefCitations
 *      0 or more figureCitations
 * 
 * The last three (materialCitations, bibRefCitations, and figureCitations) 
 * are similar to each other in that they contain only attributes from the 
 * XML tagged sections. So we can combine their extraction logic into a 
 * common function called 'parseSectionWithAttribs()'
 * 
 * The treatment data structure looks as follows
 * 
 * treatment = {
 *      treatment: {},
 *      treatmentCitations: [ {}, {}, … ],
 *      treatmentAuthors: [ {}, {}, … ],
 *      materialsCitations: [ {}, {}, … ],
 *      bibRefCitations: [ {}, {}, … ],
 *      figureCitations: [ {}, {}, … ]
 * }
 */

let extracted = {
    treatments: 0,
    treatmentCitations: 0,
    treatmentAuthors: 0,
    materialsCitations: 0,
    figureCitations: 0,
    bibRefCitations: 0
}

const stats = function(treatments, endProc) {

    extracted.treatments = extracted.treatments + treatments.length;

    for (let i = 0, j = treatments.length; i < j; i++) {
        const treatment = treatments[i];
        if (treatment.treatmentCitations) {
            extracted.treatmentCitations = extracted.treatmentCitations + treatment.treatmentCitations.length;
        }
        if (treatment.treatmentAuthors) {
            extracted.treatmentAuthors = extracted.treatmentAuthors + treatment.treatmentAuthors.length;
        }
        if (treatment.materialsCitations) {
            extracted.materialsCitations = extracted.materialsCitations + treatment.materialsCitations.length;
        }
        if (treatment.figureCitations) {
            extracted.figureCitations = extracted.figureCitations + treatment.figureCitations.length;
        }
        if (treatment.bibRefCitations) {
            extracted.bibRefCitations = extracted.bibRefCitations + treatment.bibRefCitations.length;
        }
    }

    if (endProc) {
        return JSON.stringify(extracted);
    }
};

const parseOne = function(treatmentId) {
    const xml = fs.readFileSync(`${xmlDumpDir}/${treatmentId + '.xml'}`, 'utf8');
    const treatment = cheerioparse(xml, treatmentId);

    return {
        treatment:          treatment.treatment,
        treatmentAuthors:   treatment.treatmentAuthors,
        materialsCitations: treatment.materialsCitations,
        treatmentCitations: treatment.treatmentCitations,
        figureCitations:    treatment.figureCitations,
        bibRefCitations:    treatment.bibRefCitations
    }
    
};

const parseTreatmentCitations = function($) {

    let tc = [];

    const trecitgroups = $('subSubSection[type=reference_group] treatmentCitationGroup');
    
    if (trecitgroups.length) {
        
        for (let i = 0, j = trecitgroups.length; i < j; i++) {
            const trecitgroup = $(trecitgroups[i]);
            let treatmentCitationText;

            const taxonomicName = $('taxonomicName', trecitgroup);
            if (Array.isArray(taxonomicName)) {

                if (taxonomicName[0].children) {
                    treatmentCitationText = taxonomicName[0].children[0].data;
                    if (taxonomicName.attr('authority')) {
                        treatmentCitationText += ' ' + taxonomicName.attr('authority')
                    }
                }
            }
            
            const treatmentCitations = $('treatmentCitation', trecitgroup);
            
            if (treatmentCitations.length) {
                for (let k = 0, l = treatmentCitations.length; k < l; k++) {
                    const bib = $('bibRefCitation', treatmentCitations[k]).text();
                    if (bib) {
                        treatmentCitationText += ' sec. ' + bib
                    }

                    let refString = $('bibRefCitation', treatmentCitations[k]).attr('refString');

                    tc.push({
                        treatmentCitation: treatmentCitationText,
                        refString: refString
                    })
                }
            }
        }
        
    }

    return tc;

};

const parseTreatmentAuthors = function($) {

    const treaut = $('mods\\:mods mods\\:name[type=personal]');
    let ta = [];

    if (treaut.length) {

        for (let i = 0, j = treaut.length; i < j; i++) {

            let treatmentAuthor = {};

            dataDict.treatmentAuthors.forEach(el => {
                const role = $('mods\\:role mods\\:roleTerm', treaut[i]).text();
                if (role === 'Author') {

                    if ($('mods\\:namePart', treaut[i]).text()) {
                        treatmentAuthor[el.plazi] = $('mods\\:namePart', treaut[i]).text();
                    }

                }
            })

            ta.push(treatmentAuthor)
        }

    }

    return ta;
  
};

const parseBibRefCitations = function($) {

    const elements = $('bibRefCitation');
    let entries = [];

    if (elements.length) {

        for (let i = 0, j = elements.length; i < j; i++) {

            let entry = {};

            dataDict.bibRefCitations.forEach(el => {
                entry[el.plazi] = $(elements[i]).attr(el.plazi);
            })

            entries.push(entry)
        }
    }

    return entries;
  
};

const parseFigureCitations = function($) {

    const elements = $('figureCitation');
    let entries = [];

    if (elements.length) {

        for (let i = 0, j = elements.length; i < j; i++) {

            let entry = {};
            dataDict.figureCitations.forEach(el => {
                entry[el.plazi] = $(elements[i]).attr(el.plazi);
            })

            entries.push(entry)
        }
    }

    return entries;
  
};

const parseMaterialsCitations = function($) {

    const elements = $('materialsCitation');
    let entries = [];

    if (elements.length) {

        for (let i = 0, j = elements.length; i < j; i++) {

            let entry = {};
            dataDict.materialsCitations.forEach(el => {
                entry[el.plazi] = $(elements[i]).attr(el.plazi);
            })

            entries.push(entry)
        }
    }

    return entries;
  
};

// const parseSectionsWithAttribs = function(sectionName, $) {

//     let sectionArray = [];

//     if ($.length) {

//         for (let i = 0, j = $.length; i < j; i++) {
            
//             let section = {};
//             let atLeastOneValue = false;

//             dataDict[sectionName].forEach(el => {

//                 // add the attribute to the row only if the 
//                 // attribute is present
//                 if ($[i].attribs[el.plazi]) {
//                     atLeastOneValue = true;
//                     section[el.plazi] = $[i].attribs[el.plazi];
//                 }
//                 else {
//                     section[el.plazi] = '';
//                 }
                
//             })

//             // Add a row if at least one field has a value
//             if (atLeastOneValue) {
//                 sectionArray.push(section)
//             }
//         }
//     }

//     return sectionArray;
// };

const parseTreament = function($) {
        
    let treatment = {};
    
    dataDict.treatments.forEach(el => {
        let val = eval(el.element);
        treatment[el.plazi] = val ? val.trim() : '';
    })

    return treatment
};

const cheerioparse = function(xml, treatmentId) {
    
    const $ = cheerio.load(xml, {
        normalizeWhitespace: true,
        xmlMode: true
    });

    let treatment = {};
    treatment.treatment = parseTreament($)

    // The following two functions are used to filter out any 
    // empty objects returned from parsing, and to add the 
    // 'treatmentId' to each remaining object so it can be 
    // used as a foreign key to connect the object to the 
    // parent treatment
    const emptyObjs = (el) => Object.keys(el).length > 0;
    const addTreatmentId = (el) => {
        el['treatmentId'] = treatmentId;
        return el;
    }

    let ta = parseTreatmentAuthors($);
    if (ta.length) {
        treatment.treatmentAuthors = ta.filter(emptyObjs);
        treatment.treatmentAuthors.forEach(addTreatmentId);
    }

    let tc = parseTreatmentCitations($);
    if (tc.length) {
        treatment.treatmentCitations = tc.filter(emptyObjs);
        treatment.treatmentCitations.forEach(addTreatmentId);
    }

    let br = parseBibRefCitations($);
    if (br.length) {
        treatment.bibRefCitations = br.filter(emptyObjs);
        treatment.bibRefCitations.forEach(addTreatmentId);
    }

    let fc = parseFigureCitations($);
    if (fc.length) {
        treatment.figureCitations = fc.filter(emptyObjs);
        treatment.figureCitations.forEach(addTreatmentId);
    }

    let mc = parseMaterialsCitations($);
    if (mc.length) {
        treatment.materialsCitations = mc.filter(emptyObjs);
        treatment.materialsCitations.forEach(addTreatmentId);
    }
    

    // Parse the XML for the sections with attributes only. 
    // These sections can be processed with a common logic.
    // [
    //     //['materialCitations', $('subSubSection[type=materials_examined] materialsCitation')],
    //     ['materialCitations', $('materialsCitation')],
    //     //['figureCitations', $('figureCitation')],
    //     //['bibRefCitations', $('bibRefCitation')]
    // ].forEach(el => {
    //     const data = parseSectionsWithAttribs(el[0], el[1]);

    //     if (data.length) {
    //         treatment[el[0]] = data.map(addTreatmentId);
    //     }
    // })

    return treatment;
        
};

module.exports = function(n, rearrangeOpt = false, databaseOpt = false) {

    if (databaseOpt) {
        database.createTables();
    }

    //const xmlre = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[1-5][0-9a-f]{3}-?[89ab][0-9a-f]{3}-?[0-9a-f]{12}$/i;
    if (n.length === 32) {

        const treatment = parseOne(n);
        console.log(treatment);

    }
    else {

        const start = performance.now().toFixed(2);
        const xmlsArr = fs.readdirSync(xmlDumpDir);
        let i = 0;
        let j = typeof(n) === 'number' ? n : xmlsArr.length;

        // update the progress bar every x% of the total num of files
        // but x% of j should not be more than 10000
        let x = 10;
        const transactionLimit = 5000;
        if ((j / x) > transactionLimit) {
            x = Math.floor(j / transactionLimit);
        }

        const tickInterval = Math.floor( j / (j / x) );
        const bar = new progress('processing [:bar] :rate files/sec :current/:total done (:percent) time left: :etas', {
            complete: '=',
            incomplete: ' ',
            width: 30,
            total: j
        });
    
        const batch = Math.floor(j / x);
        let treatments = [];
    
        let endProc = false;
        let count = 0;
        for (; i < j; i++) {

            if (i == (j - 1)) {
                endProc = true;
            }

            // update progress bar every tickInterval
            if (!(i % tickInterval)) {
                bar.tick(tickInterval)
            }

            if (rearrangeOpt) {

                // rearrange XMLs into a hierachical structure
                rearrange(xmlsArr[i])
            }

            const treatmentId = path.basename(xmlsArr[i], '.xml');
            treatments.push(parseOne(treatmentId));
        
            if (!(i % batch)) {

                if (databaseOpt) {
                    database.loadData(treatments);
                }
                stats(treatments, endProc);
                treatments = [];
                    
            }
            
        }

        if (databaseOpt) {
            database.loadData(treatments);
            database.indexTables();
            database.loadFTSTreatments();
        }
        
        logger({
            host: 'localhost',
            start: start,
            end: performance.now().toFixed(2),
            status: 'OK',
            resource: 'parse',
            query: n,
            message: stats(treatments, endProc)
        });
        
    }

};
