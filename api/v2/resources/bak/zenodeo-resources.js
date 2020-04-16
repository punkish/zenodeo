'use strict';

const routeMaker = require('../lib/h2');

const resources = [
    {
        _resource: 'treatments',
        _resourceId: 'treatmentId'
    },
    {
        _resource: 'figureCitations',
        _resourceId: 'figureCitationId'
    },
    {
        _resource: 'treatmentCitations',
        _resourceId: 'treatmentCitationId'
    },
    {
        _resource: 'materialsCitations',
        _resourceId: 'materialsCitationId'
    },
    {
        _resource: 'bibRefCitations',
        _resourceId: 'bibRefCitationId'
    },
    {
        _resource: 'treatmentAuthors',
        _resourceId: 'treatmentAuthorId'
    }
];

const routes = [];
resources.forEach((r, i) => {
    r._order = i;
    routes.push({ plugin: routeMaker(r) })
});

module.exports = routes;