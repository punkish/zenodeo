'use strict';

const plugins = {
    _resource: 'figureCitation',
    _resources: 'figureCitations',
    _resourceId: 'figureCitationId',
    _name: 'figureCitations2',
    _path: '/figurecitations',
    _order: 4
};

const h = require('../lib/h2');
module.exports = h(plugins);