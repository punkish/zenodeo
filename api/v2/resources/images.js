'use strict';

const Schema = require('../schema.js');
const ResponseMessages = require('../../responseMessages');
const Utils = require('../utils');

const plugins = {
    _resource: 'image',
    _resources: 'images',
    _resourceId: 'id',
    _name: 'images2',
    _segment: 'images2',
    _path: 'images',
    _order: 7
};

const {handler, getRecords} = require('../lib/z');
const h = require('../lib/h');
module.exports = h(plugins, handler, getRecords);