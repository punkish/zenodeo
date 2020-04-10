'use strict';

const plugins = {
    _resource: 'treatmentCitation',
    _resources: 'treatmentCitations',
    _resourceId: 'treatmentCitationId',
    _name: 'treatmentcitations2',
    _path: 'treatmentcitations',
    _order: 4
};

const h = require('../lib/h2');
module.exports = h(plugins);