'use strict';

const plugins = {
    _resource: 'taxon',
    _resources: 'taxa',
    _resourceId: '',
    _name: 'taxa2',
    _path: 'taxa',
    _order: 9
};

const h = require('../lib/h3');
module.exports = h(plugins);