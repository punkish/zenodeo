'use strict';

const csv = require('csvtojson');
//const Joi = require('joi');
//const Schema = require('../api/v1/schema')

const csvFilePath = './dataDictionary/data-dictionary.csv';

// const typeToJoi = {
//     uuid: Joi.string(),
//     string: Joi.string(),
//     number: Joi.number()
// }

// {
//     "plazi": "treatmentCitation",
//     "zenodo": "subjects; AND if there is a DOI for the treatmentCitation, relatedIdentifiers[cites];",
//     "type": "string",
//     "element": "$('subSubSection[type=reference_group] treatmentCitationGroup taxonomicName').text() + ' ' + $('subSubSection[type=reference_group] treatmentCitationGroup taxonomicName').attr('authority') + ' sec. ' + $('subSubSection[type=reference_group] treatmentCitationGroup bibRefCitation').text()",
//     "definition": "The taxonomic name and the author of the species, plus the author of the treatment being cited."
// }

const jsObj2Schema = function(jsObj) {

    const tables = {};

    jsObj.forEach(el => tables[el.table] = {} );

    const b = {};
    jsObj.forEach(el => {

        const table = el.table
        const plaziName = el.plaziName
        delete(el.table)
        delete(el.plaziName)

        //tables[table] = {}
       // const attribs = {}

        tables[table][plaziName] = el;
        //tables[table].push(attribs)

    })

    console.log(tables)
}

csv()
    .fromFile(csvFilePath)
    .then((jsObj) => jsObj2Schema(jsObj));