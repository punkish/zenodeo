'use strict';

/*************************************************************
 *
 * This is a factory routine that uses another factor routine
 * called `routeMaker` to create an array of routes and 
 * export them.
 * 
 *************************************************************/

// The resource groups
// - zenodeoCore
// - zenodeoRelated
// - zenodeo
// - lookups
const { resourceGroups } = require('../../v2/lib/dd2datadictionary');

const routes = [];

// 'order' is a route index that is used by the Hapi-Swagger
// plugin to visibly order the routes in the auto-generated
// documentation on the website (see …/docs)
let order = 0;

for (let g in resourceGroups) {

    const routeMaker = require('../lib/routeMaker');

    // Loop over every resource (column in the database that can be 
    // queried by the API), add the 'order' and the group name 'group'
    // to it, and push it as a plugin into the array of routes to 
    // be sent back
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
