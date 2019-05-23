'use strict';

const cheerio = require('cheerio');
//const dataDict = require('./data-dictionary');
const dataDict = require('../../dataDictionary/data-dictionary');
const fs = require('fs');
const path = require('path');

const config = require('config');
const xmlDumpDir = config.get('bin.renew.parsex.xmlDumpDir');

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
 *      materialCitations: [ {}, {}, … ],
 *      bibRefCitations: [ {}, {}, … ],
 *      figureCitations: [ {}, {}, … ]
 * }
 */

const parsex = {

    parseTreatmentCitations: function($) {

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
                
                const treatmentCitations = $('treatmentCitation', taxonomicName);
                if (treatmentCitations.length) {
                    for (let k = 0, l = treatmentCitations.length; k < l; k++) {
                        const bib = $('bibRefCitation', treatmentCitations[k]).text();
                        if (bib) {
                            treatmentCitationText += ' sec. ' + bib
                        }

                        let refString = $('bibRefCitation', treatmentCitations[k]).attr('refString');

                        tc.push({
                            treatmentCitationText: treatmentCitationText,
                            refString: refString
                        })
                    }
                }
            }

            return tc;
        }

    },

    parseTreatmentAuthors: function($) {

        const treaut = $('mods\\:mods mods\\:name[type=personal]');
        let ta = [];

        if (treaut.length) {

            for (let i = 0, j = treaut.length; i < j; i++) {

                let treatmentAuthor = {};

                dataDict.treatmentAuthors.forEach(el => {
                    const role = $('mods\\:role mods\\:roleTerm', treaut[i]).text();
                    if (role === 'Author') {

                        if ($('mods\\:namePart', treaut[i]).text()) {
                            treatmentAuthor[el["plazi"]] = $('mods\\:namePart', treaut[i]).text();
                        }

                    }
                })

                ta.push(treatmentAuthor)
            }

            return ta;
        }

        
    },

    parseSectionsWithAttribs: function(sectionName, $) {

        let sectionArray = [];

        if ($.length) {

            for (let i = 0, j = $.length; i < j; i++) {

                let section = {};
                let atLeastOneValue = false;

                dataDict[sectionName].forEach(el => {
                    

                    // add the attribute to the row only if the 
                    // attribute is present
                    if ($[i].attribs[el["plazi"]]) {

                        atLeastOneValue = true;
                        section[el["plazi"]] = $[i].attribs[el["plazi"]];
                    }
                    else {
                        section[el["plazi"]] = '';
                    }

                })

                // Add a row if at least one field has a value
                if (atLeastOneValue) {
                    sectionArray.push(section)
                }
            }
        }

        return sectionArray;
    },

    parseTreament: function($) {
         
        let treatment = {};

        dataDict.treatments.forEach(el => {
            let val = eval(el["element"]);
            if (typeof val !== 'undefined') {
                treatment[el["plazi"]] = val.trim();
            }
            else {
                treatment[el["plazi"]] = ''
            }
        })

        const t = [treatment];
        return treatment
    },

    parseOne: function(treatmentXml) {
        const xml = fs.readFileSync(`${xmlDumpDir}/${treatmentXml}`, 'utf8');
    
        const treatmentId = path.basename(treatmentXml, '.xml');
        const treatment = this.cheerioparse(xml, treatmentId);
    
        return {
            treatment: treatment['treatment'],
            treatmentAuthors: treatment['treatmentAuthors'],
            materialCitations: treatment['materialCitations'],
            treamentCitations: treatment['treamentCitations'],
            figureCitations: treatment['figureCitations'],
            bibRefCitations: treatment['bibRefCitations']
        }
        
    },

    cheerioparse: function(xml, treatmentId) {
        
            const $ = cheerio.load(xml, {
                normalizeWhitespace: true,
                xmlMode: true
            });

            let treatment = {};
            treatment['treatment'] = this.parseTreament($)

            // The following two functions are used to 
            // filter out any empty objects returned from 
            // parsing, and to add the 'treatmentId' to each
            // remaining object so it can be used as a 
            // foreign key to connect the object to the 
            // parent treatment
            const emptyObjs = (el) => Object.keys(el).length > 0;
            const addTreatmentId = (el) => {
                el['treatmentId'] = treatmentId;
                return el;
            }

            let ta;
            if (ta = this.parseTreatmentAuthors($)) {
                treatment['treatmentAuthors'] = ta.filter(emptyObjs);
                treatment['treatmentAuthors'].forEach(addTreatmentId);
            }

            let tc;
            if (tc = this.parseTreatmentCitations($)) {
                treatment['treamentCitations'] = tc.filter(emptyObjs);
                treatment['treamentCitations'].forEach(addTreatmentId);
            }


            // Parse the XML for the sections with attributes
            // only. As mentinoed above, these sections can 
            // be processed with a common logic.
            [
                ['materialCitations', $('subSubSection[type=materials_examined] materialsCitation')],
                ['figureCitations', $('figureCitation')],
                ['bibRefCitations', $('bibRefCitation')]
            ].forEach(el => {
                const data = this.parseSectionsWithAttribs(el[0], el[1]);

                if (data.length) {
                    treatment[el[0]] = data.map(addTreatmentId);
                }
            })

            return treatment;
            
    }
};

module.exports = parsex;
