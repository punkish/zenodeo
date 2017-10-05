const inert = {
    method: 'GET',

    path: '/{param*}',

    config: {
        description: "static files",
        tags: ['private']
    },

    handler: {
        directory: {
            path: '.',
            redirectToSlash: true,
            index: true
        }
    }
};

module.exports = inert;