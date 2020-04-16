'use strict';

const Schema = require('../schema.js');
const ResponseMessages = require('../../responseMessages');
const Utils = require('../utils');

const plugins = {
    _resource: 'publication',
    _resources: 'publications',
    _resourceId: 'id',
    _name: 'publications2',
    _segment: 'publications2',
    _path: 'publications',
    _order: 8
};

const {handler, getRecords} = require('../lib/z');
const h = require('../lib/h');
module.exports = h(plugins, handler, getRecords);