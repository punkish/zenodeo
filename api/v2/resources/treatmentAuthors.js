'use strict';

const plugins = {
    _resource: 'treatmentAuthor',
    _resources: 'treatmentAuthors',
    _resourceId: 'treatmentAuthorId',
    _name: 'treatmentAuthors2',
    _path: 'treatmentauthors',
    _order: 6
};

const h = require('../lib/h2');
module.exports = h(plugins);