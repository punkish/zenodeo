'use strict';

const plugins = {
    _resource: 'treatment',
    _resources: 'treatments',
    _resourceId: 'treatmentId',
    _name: 'treatments2',
    _path: '/treatments',
    _order: 2
};

const h = require('../lib/h2');
module.exports = h(plugins);