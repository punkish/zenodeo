'use strict';

const plugins = {
    _resource: 'citation',
    _resources: 'citations',
    _resourceId: 'bibRefCitationId',
    _name: 'citation2',
    _path: '/citations',
    _order: 3
};

const h = require('../lib/h2');
module.exports = h(plugins);