'use strict';

/***********************************************************************
 * 
 * Here we convert the combined and flattened data-dictionary into a 
 * schema that can be used by Joi for parameter vaidation in the 
 * incoming REST API queries. 
 * 
 **********************************************************************/

const Joi = require('@hapi/joi');
const { dataDictionary } = require('./dd2datadictionary');
const Boom = require('@hapi/boom');


const dd2schema = function() {

    // the schema object we are going to construct
    const so = {};
    const soLog = {};

    for (let resource in dataDictionary) {

        // resource-specific schema description
        const rso = {};
        const rsoLog = {};

        // resource-specific data dictionary
        const rdd = dataDictionary[resource];

        for (let i = 0, j = rdd.length; i < j; i++) {
            
            const f = rdd[i];            
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
    
    return { Schema: so, SchemaLog: soLog };

};

const test = function() {

    const { Schema, SchemaLog } = dd2schema();
    console.log(SchemaLog);

    const { error, value } = Schema.materialsCitations.query.validate({
        materialsCitationId: '19325B47274DC7B60C78E6AEBFAB8689'
    });

    if (error) {

        console.log(error);
    }
    else {

        console.log('passed');
    }

};


// https://stackoverflow.com/questions/6398196/detect-if-called-through-require-or-directly-by-command-line?rq=1
if (require.main === module) {
    
    test();
} 
else {
    
    module.exports = (dd2schema)();
}