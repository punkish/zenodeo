'use strict';

const Joi = require('@hapi/joi');
const { dataDictionary, resourceGroups } = require('./dd2datadictionary');
const Boom = require('@hapi/boom');

// 'resources' is the plural form of the desired resource
// for example, 'treatments' or 'materialsCitations'
const dd2schema = function() {

    // the schema object we are going to construct
    const so = {};
    const soLog = {};

    for (let resource in dataDictionary) {

        // resource-specific data dictionary
        const rdd = dataDictionary[resource];

        // resource-specific schema description
        const rso = {};
        const rsoLog = {};

        for (let i = 0, j = rdd.length; i < j; i++) {
            const f = rdd[i];
            //const n = f.plaziName;
            
            const qs = f.queryString;
            
            if (qs) {
                const r = resource;
                const d = f.description;
                const v = f.validation;
                rso[qs] = eval(v);
                rsoLog[qs] = `${eval(v)}`;
            }
            
        }

        so[resource] = { 

            query: Joi.object(rso), 
            failAction: (request, h, err) => {
                throw Boom.badRequest(err)
            }

        };

        soLog[resource] = { query: `Joi.object(${JSON.stringify(rsoLog, null, 4)})` };
    }
    
    //plog.info('Schema Object', so);
    return so;

};

// const so = dd2schema();

// const { error, value } = so.treatments.query.validate({
//     communities: 'biosyslit',
//     refreshCache: false,
//     page: 1,
//     size: 30,
//     //resources: 'treatments',
//     facets: true,
//     stats: true,
//     xml: false,
//     sortBy: 'journalYear:ASC',
//     q: 'carabus',
//     // authorityName: 'Agosti',
//     // journalYear: '1996',
//     format: 'xml',
//     treatmentTitle: 'opheys',
//     doi: '10.2454/sdff:1956'
// });

// if (error) {
//     console.log(error);
// }
// else {
//     plog.info('passed');
// }

module.exports = (dd2schema)();