'use strict';

const plugins = {
    _resource: 'materialsCitation',
    _resources: 'materialsCitations',
    _resourceId: 'materialsCitationId',
    _name: 'materialscitations2',
    _path: 'materialscitations',
    _order: 5
};

const h = require('../lib/h2');
module.exports = h(plugins);