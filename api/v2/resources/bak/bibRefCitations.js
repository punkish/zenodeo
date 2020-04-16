'use strict';

const plugins = {
    _resource: 'bibRefCitation',
    _resources: 'bibRefCitations',
    _resourceId: 'bibRefCitationId',
    _name: 'bibrefcitations2',
    _path: 'bibrefcitations',
    _order: 3
};

const h = require('../lib/h2');
module.exports = h(plugins);