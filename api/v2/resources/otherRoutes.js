'use strict';

const { dataDictionary, resourceGroups } = require('../../v2/lib/dd2datadictionary');

const routes = [];
let order = 0;

for (let g in resourceGroups) {

    const routeMaker = require('../lib/routeMaker');

    const resources = resourceGroups[g];
    for (let i = 0, j = resources.length; i < j; i++) {

        const resource = resources[i];

        order++;
        resource.order = order;
        resource.group = g;

        const route = routeMaker(resource);
        routes.push({ plugin: route });

    }

}

module.exports = routes;