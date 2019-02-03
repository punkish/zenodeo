'use strict';

const Debug = require('debug')('parsex  :');
const fs = require('fs');
const path = require('path');
const Config = require('../../config');
const cheerio = require('cheerio');

const parsex = {
    cheerioparse: function(xml, treatment_id) {
        //Debug(`parsing ${treatment_id}\n------------------------------\n`);
        const $ = cheerio.load(xml, {
            normalizeWhitespace: true,
            xmlMode: true
        });

        const tr = {
            treatment_id: treatment_id,
            document_attr: JSON.stringify($('document').attr()),
            taxonomicname_attr: JSON.stringify($('subSubSection[type=nomenclature] taxonomicName').attr()),
            treatment_text: $('treatment').text()
        }
    
        const mc = [];
        const matcit = $('materialsCitation');
        if (matcit.length) {
            for (let i = 0, j = matcit.length; i < j; i++) {
                mc.push({
                    treatment_id: treatment_id,
                    location: matcit[i].attribs.location,
                    latitude: matcit[i].attribs.latitude, 
                    longitude: matcit[i].attribs.longitude, 
                    materialcitation_attr: JSON.stringify(matcit[i].attribs)
                });
            }
        }
    
        const tc = [];
        const trecit = $('treatmentCitation');
        if (trecit.length) {
            for (let i = 0, j = trecit.length; i < j; i++) {
                //console.log(trecit[i])
                tc.push({
                    treatment_id: treatment_id,
                    treatmentcitation_attr: JSON.stringify(trecit[i].attribs)
                });
            }
        }

        //const pub = $('document').attr('ModsDocAuthor') + ' ' + $('document').attr('ModsDocDate') + '. ' + $('document').attr('ModsDocTitle') + ' ' + $('document').attr('docOrigin') + ', pp. ' + $('document').attr('masterPageNumber') + '-' + $('document').attr('masterLastPageNumber');
        //const title = $('document').attr('docTitle');
        return [tr, mc, tc]
    }
};



// const selectDb = function() {
//     const res = ds.prepare('SELECT DISTINCT json_extract(attribs, "$.location") location,json_extract(attribs, "$.latitude") latitude, json_extract(attribs, "$.longitude") longitude FROM materialsCitations WHERE latitude IS NOT null').all();
//     return res;
// }

module.exports = parsex;
