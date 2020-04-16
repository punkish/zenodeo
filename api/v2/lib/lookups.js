/**************************************
 * abstracted logic for the handler and other functions 
 * for lookups that are fetched from Zenodeo
 * - authors
 * - taxa
 * - families
 * - keywords
 **************************************/

'use strict';

const Utils = require('../utils');

const handler = function(resource) {
    
    return async function(request, h) {
        
        return getRecords(request.query.q, resource.name);
    };

};

const getRecords = function(q, resource) {

    return Utils.find(q, resource);
};

module.exports = { handler, getRecords };