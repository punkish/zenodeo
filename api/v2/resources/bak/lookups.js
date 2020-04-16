'use strict';

const routeMaker = require('../lib/h3');

const resources = [
    {
        _resource: 'families',
        _resourceId: ''
    },
    {
        _resource: 'taxa',
        _resourceId: ''
    },
    {
        _resource: 'keywords',
        _resourceId: ''
    },
    {
        _resource: 'authors',
        _resourceId: ''
    }
];

const routes = [];
resources.forEach((r, i) => {
    r._order = i;
    routes.push({ plugin: routeMaker(r) })
});

module.exports = routes;