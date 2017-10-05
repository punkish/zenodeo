const index = {

    method: 'GET',

    path: '/docs',

    config: {
        description: "index",
        tags: ['zenodeo'],
        validate: {},
        notes: [
            'root',
        ]
    },

    handler: function(request, reply) {
        reply.view('index.html', {});
    }
};

module.exports = index;