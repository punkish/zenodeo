'use strict';

const config = require('config');
const plog = require(config.get('plog'));
const dd = require('../../api/v2/lib/dd2datadictionary').dataDictionary;

for (let resource in dd) {
    console.log(resource)
}