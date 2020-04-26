'use strict';

// Support for serving static files
module.exports = {
    method: 'GET',
    path: '/public/{param*}',
    config: {
        description: "static files",
        tags: ['private']
    },
    handler: {
        directory: {
            path: './public',
            redirectToSlash: true,
            index: true
        }
    }
};
