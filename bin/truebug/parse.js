'use strict';

const fs = require('fs');
const path = require('path');
const progress = require('progress');
const cheerio = require('cheerio');
const chance = require('chance').Chance();

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

// used to store statistics after every transaction
const extracted = {
    treatments: 0,
    treatmentCitations: 0,
    treatmentAuthors: 0,
    materialsCitations: 0,
    figureCitations: 0,
    bibRefCitations: 0
}

const stats = function(treatments, endProc) {

    let i = 0;
    let j = treatments.length;

    extracted.treatments = extracted.treatments + j;

    for (; i < j; i++) {
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

    return JSON.stringify(extracted, null, '\t');
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

const parseTreatmentCitations = function($, treatmentId) {

    let tc = [];
    const trecitgroups = $('treatmentCitationGroup', 'subSubSection[type=reference_group]');
    
    if (trecitgroups.length) {
        
        let i = 0;
        let j = trecitgroups.length;

        for (; i < j; i++) {
            const trecitgroup = $(trecitgroups[i]);
            const taxonomicName = $('taxonomicName', trecitgroup);            
            let tname = Array.isArray(taxonomicName) ? taxonomicName[0] : taxonomicName;

            let tcPrefixArray = [];
            tcPrefixArray.push(tname.text().trim());
            tcPrefixArray.push(tname.attr('authorityName') + ',');
            tcPrefixArray.push(tname.attr('authorityYear'));

            let tcPrefix = tcPrefixArray.join(' ');
            
            const treatmentCitations = $('treatmentCitation', trecitgroup);
            const treatmentCitationId = chance.guid();

            let treatmentCitation;
            if (treatmentCitations.length) {

                let k = 0;
                let l = treatmentCitations.length

                for (; k < l; k++) {
                    treatmentCitation = tcPrefix;

                    const bib = $('bibRefCitation', treatmentCitations[k]);
                    if (k > 0) {
                        treatmentCitation += ' sec. ' + bib.text();
                    }

                    tc.push({
                        treatmentCitationId: treatmentCitationId,
                        treatmentId: treatmentId,
                        treatmentCitation: treatmentCitation,
                        refString: bib.attr('refString'),
                        deleted: 'false'
                    });
                }
            }
            else {
                treatmentCitation = tcPrefix;

                const bib = $('bibRefCitation', treatmentCitations);
                if (bib) {
                    treatmentCitation += ' sec. ' + bib.text()
                }

                tc.push({
                    treatmentCitationId: treatmentCitationId,
                    treatmentId: treatmentId,
                    treatmentCitation: treatmentCitation,
                    refString: bib.attr('refString'),
                    deleted: 'false'
                });
            }
        }
        
    }

    return tc;

};

const parseTreatmentAuthors = function($, treatmentId) {

    const treaut = $('mods\\:mods mods\\:name[type=personal]');
    let ta = [];

    if (treaut.length) {

        for (let i = 0, j = treaut.length; i < j; i++) {

            const role = $('mods\\:role mods\\:roleTerm', treaut[i]).text();
            if (role === 'Author') {

                ta.push({
                    treatmentAuthorId: chance.guid(),
                    treatmentId: treatmentId,
                    treatmentAuthor: $('mods\\:namePart', treaut[i]).text() || '',
                    deleted: 'false'
                })
            }
            
        }

    }

    return ta;
  
};

const foo = function($, treatmentId, part) {

    const elements = $(part);
    const id = part + 'Id';
    const num = elements.length;
    const parts = part + 's';
    let entries = [];

    if (num) {

        for (let i = 0, j = num; i < j; i++) {

            let entry = {};

            dataDict[parts].forEach(el => {
                entry[el.plazi] = $(elements[i]).attr(el.plazi) || '';
            });

            entry[id] = chance.guid();
            entry.treatmentId = treatmentId;
            entry.deleted = 'false';

            entries.push(entry)
        }
    }

    return entries;
  
};

const parseTreament = function($, treatmentId) {
        
    let treatment = {};
    
    dataDict.treatments.forEach(el => {
        let val = eval(el.element) || '';
        if (el.plazi === 'treatmentId') {
            val = treatmentId;
        }
        else if (el.plazi === 'deleted') {
            val = 'false';
        }
        
        if (typeof val === 'string') {
            treatment[el.plazi] = val ? val.trim() : '';
        }
        else {
            treatment[el.plazi] = val;
        }
    })

    return treatment
};

const cheerioparse = function(xml, treatmentId) {
    
    const $ = cheerio.load(xml, {
        normalizeWhitespace: true,
        xmlMode: true
    });

    let treatment = {};
    treatment.treatment = parseTreament($, treatmentId)

    // The following two functions are used to filter out any 
    // empty objects returned from parsing, and to add the 
    // 'treatmentId' to each remaining object so it can be 
    // used as a foreign key to connect the object to the 
    // parent treatment
    const emptyObjs = (el) => Object.keys(el).length > 0;
    // const addTreatmentId = (el) => {
    //     el.treatmentId = treatmentId;
    //     return el;
    // }

    let ta = parseTreatmentAuthors($, treatmentId);
    if (ta.length) {
        treatment.treatmentAuthors = ta.filter(emptyObjs);
        //treatment.treatmentAuthors.forEach(addTreatmentId);
    }

    let tc = parseTreatmentCitations($, treatmentId);
    if (tc.length) {
        treatment.treatmentCitations = tc.filter(emptyObjs);
        //treatment.treatmentCitations.forEach(addTreatmentId);
    }

    //let br = parseBibRefCitations($);
    let br = foo($, treatmentId, 'bibRefCitation');
    if (br.length) {
        treatment.bibRefCitations = br.filter(emptyObjs);
        //treatment.bibRefCitations.forEach(addTreatmentId);
    }

    //let fc = parseFigureCitations($);
    let fc = foo($, treatmentId, 'figureCitation');
    if (fc.length) {
        treatment.figureCitations = fc.filter(emptyObjs);
        //treatment.figureCitations.forEach(addTreatmentId);
    }

    //let mc = parseMaterialsCitations($);
    let mc = foo($, treatmentId, 'materialsCitation');
    if (mc.length) {
        treatment.materialsCitations = mc.filter(emptyObjs);
        //treatment.materialsCitations.forEach(addTreatmentId);
    }

    return treatment;
        
};

module.exports = function(n, rearrangeOpt = false, databaseOpt = false) {

    //const xmlre = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[1-5][0-9a-f]{3}-?[89ab][0-9a-f]{3}-?[0-9a-f]{12}$/i;
    if (n.length === 32) {

        const treatment = parseOne(n);
        console.log(treatment);

    }
    else {

        const start = new Date().getTime();
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

                bar.interrupt(stats(treatments, endProc) + '\n');

                if (databaseOpt) {
                    database.loadData(treatments);
                }
                
                // empty the treatments for the next batch
                treatments = [];
            }
            
        }

        if (databaseOpt) {
            database.loadData(treatments);

            database.indexTables();
            database.loadFTSTreatments();
            database.loadFTSFigureCitations();
        }

        console.log('\n\n')
        logger({
            host: 'localhost',
            start: start,
            end: new Date().getTime(),
            status: 200,
            resource: 'parse',
            query: `parsed ${n}`,
            message: stats(treatments, endProc)
        })
    }

};