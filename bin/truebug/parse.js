'use strict';

const fs = require('fs');
const path = require('path');

const progress = require('progress');
const cheerio = require('cheerio');
const chance = require('chance').Chance();

const config = require('config');
const dataDict = require(config.get('v2.dataDict'));
const dataDictionary = dataDict.dataDictionary;

const treatmentsDump = config.get('truebug.treatmentsDump');


// // truebug modules
// const rearrange = require('./rearrange');
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

    //return JSON.stringify(extracted, null, '\t');
};

const parseOne = function(treatmentId) {

    const xml = fs.readFileSync(`${treatmentsDump}/${treatmentId + '.xml'}`, 'utf8');
    return cheerioparse(xml, treatmentId);    
};


// // As to the deleted (or retired, or whatever) elements: they are marked with a deleted attribute bearing value true. In addition, they also have deleteUser, deleteTime, and deleteVersion attributes.

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
            //const treatmentCitationId = chance.guid();

            let treatmentCitation;
            const l = treatmentCitations.length;
            if (l) {

                for (let k = 0; k < l; k++) {
                    treatmentCitation = tcPrefix;

                    const bib = $('bibRefCitation', treatmentCitations[k]);
                    if (k > 0) {
                        treatmentCitation += ' sec. ' + bib.text();
                    }

                    let deleted = 0;
                    if (bib.attr('deleted') && (bib.attr('deleted') === 'true')) {
                        deleted = 1;
                    }

                    tc.push({
                        treatmentCitationId: bib.attr('id') || chance.guid(),
                        treatmentId: treatmentId,
                        treatmentCitation: treatmentCitation,
                        refString: bib.attr('refString'),
                        updateVersion: bib.attr('updateVersion'),
                        deleted: deleted
                    });
                }
            }
            else {
                treatmentCitation = tcPrefix;

                const bib = $('bibRefCitation', treatmentCitations);
                if (bib) {
                    treatmentCitation += ' sec. ' + bib.text()
                }

                let deleted = 0;
                if (bib.attr('deleted') && (bib.attr('deleted') === 'true')) {
                    deleted = 1;
                }

                tc.push({
                    treatmentCitationId: bib.attr('id') || chance.guid(),
                    treatmentId: treatmentId,
                    treatmentCitation: treatmentCitation,
                    refString: bib.attr('refString'),
                    updateVersion: bib.attr('updateVersion'),
                    deleted: deleted
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

                let deleted = 0;
                if ($('mods\\:namePart', treaut[i]).attr('deleted') && ($('mods\\:namePart', treaut[i]).attr('deleted') === 'true')) {
                    deleted = 1;
                }

                ta.push({
                    treatmentAuthorId: $('mods\\:namePart', treaut[i]).attr('id') || chance.guid(),
                    treatmentId: treatmentId,
                    treatmentAuthor: $('mods\\:namePart', treaut[i]).text() || '',
                    updateVersion: $('mods\\:namePart', treaut[i]).attr('updateVersion'),
                    deleted: deleted
                })
            }
            
        }

    }

    return ta;
};

const _parse = function($, elements, parts, partId, treatmentId) {
    const num = elements.length;
    let entries = [];

    if (num) {
        for (let i = 0; i < num; i++) {

            const missingAttr = [];
            const entry = {};

            dataDictionary[parts].forEach(el => {

                if (el.cheerioElement) {
                    const attr = $(elements[i]).attr(el.plaziName);
                    if (attr) {
                        entry[el.plaziName] = attr;
                    }
                    else {
                        entry[el.plaziName] = '';
                        missingAttr.push(el.plaziName);

                    }
                }
            });

            let deleted = 0;
            if ($(elements[i]).attr('deleted') && ($(elements[i]).attr('deleted') === 'true')) {
                deleted = 1;
            }

            entry[partId] = $(elements[i]).attr('id') || chance.guid();
            entry.treatmentId = treatmentId;
            entry.updateVersion = $(elements[i]).attr('updateVersion');
            entry.deleted = deleted;

            entries.push(entry)
        }
    }

    return entries;
};

const parseBibRefCitations = function($, treatmentId) {

    const elements = $('bibRefCitation');
    return _parse($, elements, 'bibRefCitations', 'bibRefCitationId', treatmentId);  
};

const parseFigureCitations = function($, treatmentId) {

    const elements = $('figureCitation');
    return _parse($, elements, 'figureCitations', 'figureCitationId', treatmentId);
};

const parseMaterialsCitations = function($, treatmentId) {

    const elements = $('materialsCitation');
    return _parse($, elements, 'materialsCitations', 'materialsCitationId', treatmentId);
};

const parseTreament = function($, treatmentId) {
        
    let treatment = {};
    
    

    dataDictionary.treatments.forEach(el => {


        if (el.cheerioElement) {
            let val = eval(el.cheerioElement) || '';

            //if (val) {
                if (el.plaziName === 'treatmentId') {

                    val = treatmentId;
                }
                else if (el.plaziName === 'deleted') {

                    //val = val && val === 'true' ? 1 : 0;
                    if (val && val === 'true') {
                        val = 1;
                    }
                    else {
                        val = 0;
                    }
                }
                
                treatment[el.plaziName] =   typeof val === 'string' ? val.trim() : val;
                // if (typeof val === 'string') {
                //     treatment[el.plaziName] = val ? val.trim() : '';
                // }
                // else {
                //     treatment[el.plaziName] = val;
                // }
            //}
        }
    })

    return treatment
};

const getLatest = function(array, groupByKey, versionKey) {

    // remove any empty objects
    array = array.filter((el) => Object.keys(el).length > 0);
    
    const tmp = array.reduce((accumulator, currentValue, currentIndex, array) => {
        (accumulator[ currentValue[groupByKey] ] = accumulator[ currentValue[groupByKey] ] || []).push(currentValue);
        return accumulator;
    }, {});

    const reducer = (accumulator, currentValue, currentIndex, array) => {
        if (accumulator[versionKey] > currentValue[versionKey]) {
            return accumulator;
        }
        else {
            return currentValue;
        }
    };

    const foo = [];
    Object.values(tmp).forEach(el => {
        const reduced = el.reduce(reducer);
        delete(reduced[versionKey]);
        foo.push(reduced);
    });

    return foo;
};

const cheerioparse = function(xml, treatmentId) {
    
    const $ = cheerio.load(xml, {
        normalizeWhitespace: true,
        xmlMode: true
    });

    //const report = {};
    const treatment = {};
    treatment.treatment = parseTreament($, treatmentId);

    // The following two functions are used to filter out any 
    // empty objects returned from parsing, and to add the 
    // 'treatmentId' to each remaining object so it can be 
    // used as a foreign key to connect the object to the 
    // parent treatment
    const emptyObjs = (el) => Object.keys(el).length > 0;
    const addTreatmentId = (el) => el.treatmentId = treatmentId;

    
    treatment.treatmentAuthors = parseTreatmentAuthors($, treatmentId)
    treatment.treatmentCitations = parseTreatmentCitations($, treatmentId)
    treatment.bibRefCitations = parseBibRefCitations($, treatmentId)
    treatment.figureCitations = parseFigureCitations($, treatmentId)
    treatment.materialsCitations = parseMaterialsCitations($, treatmentId)


    // const ta = parseTreatmentAuthors($, treatmentId);
    // if (ta.length) {
    //     treatment.treatmentAuthors = getLatest(ta, 'treatmentAuthorId', 'updateVersion');
    // }

    // const tc = parseTreatmentCitations($, treatmentId);
    // if (tc.length) {
    //     treatment.treatmentCitations = getLatest(tc, 'treatmentCitationId', 'updateVersion');
    // }

    // const br = parseBibRefCitations($, treatmentId);
    // if (br.length) {
    //     treatment.bibRefCitations = getLatest(br, 'bibRefCitationId', 'updateVersion');
    // }

    // const fc = parseFigureCitations($, treatmentId);
    // if (fc.length) {
    //     treatment.figureCitations = getLatest(fc, 'figureCitationId', 'updateVersion');
    // }
    
    // const mc = parseMaterialsCitations($, treatmentId);
    // if (mc.length) {
    //     treatment.materialsCitations = getLatest(mc, 'materialsCitationId', 'updateVersion');
    // }
    
    return treatment;
};

module.exports = function(n, rearrangeOpt = false, databaseOpt = false) {

    //const xmlre = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[1-5][0-9a-f]{3}-?[89ab][0-9a-f]{3}-?[0-9a-f]{12}$/i;
    if (n.length === 32) {

        console.log(`going to parse treatment ${n}`)
        const treatment = parseOne(n);
        console.log('----------------------------------------\n')
        console.log(treatment);
    }
    else {

        // const start = new Date().getTime();
        const xmlsArr = fs.readdirSync(treatmentsDump);
        let i = 0;
        let j = typeof(n) === 'number' ? n : xmlsArr.length;

        /**************************************************************
         * 
         * update the progress bar every x% of the total num of files
         * but x% of j should not be more than 5000 because we don't 
         * want to insert more than 5K records at a time.
         * 
         **************************************************************/
        
        let batch = 1;
        if (j > 50) {
            batch = Math.floor(j / 10);
        }

        if (j > 5000) batch = 5000;
        const tickInterval = Math.floor( j / batch );
        const bar = new progress('processing [:bar] :rate files/sec :current/:total done (:percent) time left: :etas', {
            complete: '=',
            incomplete: ' ',
            width: 30,
            total: j
        });
    
        
        let treatments = [];
        let endProc = false;

        console.log(`- parsing XMLs and inserting into the db ${batch} at a time`)
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
            const treatment = parseOne(treatmentId)
            treatments.push(treatment);
        
            if (!(i % batch)) {

                //bar.interrupt(stats(treatments, endProc) + '\n');
                stats(treatments, endProc)

                if (databaseOpt) {
                    database.loadData(treatments);
                }
                
                // empty the treatments for the next batch
                treatments = [];
            }

            
        }

        stats(treatments, endProc);
        console.log('finished\n***********************************')
        console.log(extracted);
        //bar.interrupt(stats(treatments, endProc) + '\n');

        if (databaseOpt) {
            database.loadData(treatments);

            //database.indexTables();
            database.loadFTSTreatments();
            database.loadFTSFigureCitations();
            database.loadFTSBibRefCitations();
        }
        
    }

};