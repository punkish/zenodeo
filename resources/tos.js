const tos = {

    method: 'GET',

    path: '/tos',

    config: {
        description: "terms of service",
        tags: ['tos', 'api'],
        plugins: {
            'hapi-swagger': {
                order: 1
            }
        },
        validate: {},
        notes: [
            'These terms of service govern this website as well as the API.',
        ]
    },

    handler: function(request, reply) {
        reply.view('tos.html', {});
    }
};

module.exports = tos;