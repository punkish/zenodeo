'use strict';

const routeMaker = require('../lib/h');

const resources = [
    {
        _resource: 'images',
        _resourceId: 'id',
    },
    {
        _resource: 'publications',
        _resourceId: 'id',
    }
];

const routes = [];
resources.forEach((r, i) => {
    r._order = i;
    routes.push({ plugin: routeMaker(r) })
});

module.exports = routes;